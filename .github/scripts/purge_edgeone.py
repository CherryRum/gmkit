#!/usr/bin/env python3
"""Refresh EdgeOne hosts with Tencent Cloud API v3 signing."""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone


API_VERSION = "2022-09-01"
ACTION = "CreatePurgeTask"
SERVICE = "teo"
RETRYABLE_API_ERRORS = {
    "InternalError",
    "RequestLimitExceeded",
    "ResourceUnavailable",
}


class EdgeOneError(RuntimeError):
    """Base error for a failed EdgeOne purge."""


class RetryableEdgeOneError(EdgeOneError):
    """Temporary API or network error that may be retried."""


def _sign(key: bytes, message: str) -> bytes:
    return hmac.new(key, message.encode("utf-8"), hashlib.sha256).digest()


def _required_environment(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise EdgeOneError("Missing required environment variable: %s" % name)
    return value


def _endpoint(site_type: str) -> str:
    endpoints = {
        "cn": "teo.tencentcloudapi.com",
        "global": "teo.intl.tencentcloudapi.com",
    }
    try:
        return endpoints[site_type]
    except KeyError as error:
        raise EdgeOneError("EDGEONE_SITE_TYPE must be cn or global") from error


def build_request(
    secret_id: str,
    secret_key: str,
    zone_id: str,
    targets: list[str],
    site_type: str,
    timestamp: int | None = None,
) -> urllib.request.Request:
    """Build one signed CreatePurgeTask request without sending it."""
    host = _endpoint(site_type)
    timestamp = int(time.time()) if timestamp is None else timestamp
    date = datetime.fromtimestamp(timestamp, timezone.utc).strftime("%Y-%m-%d")
    content_type = "application/json; charset=utf-8"
    payload = json.dumps(
        {"ZoneId": zone_id, "Type": "purge_host", "Targets": targets},
        separators=(",", ":"),
    )

    canonical_headers = (
        "content-type:%s\n"
        "host:%s\n"
        "x-tc-action:%s\n" % (content_type, host, ACTION.lower())
    )
    signed_headers = "content-type;host;x-tc-action"
    canonical_request = "\n".join(
        [
            "POST",
            "/",
            "",
            canonical_headers,
            signed_headers,
            hashlib.sha256(payload.encode("utf-8")).hexdigest(),
        ]
    )
    scope = "%s/%s/tc3_request" % (date, SERVICE)
    string_to_sign = "\n".join(
        [
            "TC3-HMAC-SHA256",
            str(timestamp),
            scope,
            hashlib.sha256(canonical_request.encode("utf-8")).hexdigest(),
        ]
    )
    secret_date = _sign(("TC3" + secret_key).encode("utf-8"), date)
    secret_service = _sign(secret_date, SERVICE)
    secret_signing = _sign(secret_service, "tc3_request")
    signature = hmac.new(
        secret_signing, string_to_sign.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    authorization = (
        "TC3-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s"
        % (secret_id, scope, signed_headers, signature)
    )

    request = urllib.request.Request(
        "https://%s/" % host,
        data=payload.encode("utf-8"),
        method="POST",
    )
    request.add_header("Authorization", authorization)
    request.add_header("Content-Type", content_type)
    request.add_header("Host", host)
    request.add_header("X-TC-Action", ACTION)
    request.add_header("X-TC-Timestamp", str(timestamp))
    request.add_header("X-TC-Version", API_VERSION)
    return request


def send_request(request: urllib.request.Request, opener=urllib.request.urlopen) -> dict:
    """Send a request and reject HTTP, API, and per-target failures."""
    try:
        with opener(request, timeout=20) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        message = error.read().decode("utf-8", errors="replace")
        if error.code == 429 or error.code >= 500:
            raise RetryableEdgeOneError(
                "EdgeOne HTTP %d: %s" % (error.code, message)
            ) from error
        raise EdgeOneError("EdgeOne HTTP %d: %s" % (error.code, message)) from error
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as error:
        raise RetryableEdgeOneError("EdgeOne request failed: %s" % error) from error

    body = result.get("Response")
    if not isinstance(body, dict):
        raise EdgeOneError("EdgeOne returned an unexpected response")
    api_error = body.get("Error")
    if api_error:
        code = str(api_error.get("Code", "Unknown"))
        message = str(api_error.get("Message", "Unknown API error"))
        error_type = (
            RetryableEdgeOneError if code in RETRYABLE_API_ERRORS else EdgeOneError
        )
        raise error_type("EdgeOne API error %s: %s" % (code, message))
    if body.get("FailedList"):
        raise EdgeOneError("EdgeOne rejected targets: %s" % body["FailedList"])
    return body


def purge_with_retry(request: urllib.request.Request, attempts: int = 4) -> dict:
    """Retry temporary failures with bounded exponential backoff."""
    for attempt in range(attempts):
        try:
            return send_request(request)
        except RetryableEdgeOneError:
            if attempt + 1 >= attempts:
                raise
            time.sleep(2 ** attempt)
    raise AssertionError("unreachable")


def main() -> int:
    try:
        secret_id = _required_environment("TENCENT_SECRET_ID")
        secret_key = _required_environment("TENCENT_SECRET_KEY")
        zone_id = _required_environment("EDGEONE_ZONE_ID")
        site_type = _required_environment("EDGEONE_SITE_TYPE")
        targets = [
            target.strip()
            for target in _required_environment("EDGEONE_TARGETS").split(",")
            if target.strip()
        ]
        if not targets:
            raise EdgeOneError("EDGEONE_TARGETS does not contain a host")

        request = build_request(
            secret_id, secret_key, zone_id, targets, site_type
        )
        response = purge_with_retry(request)
        print(
            "EdgeOne purge accepted: job=%s request=%s targets=%d"
            % (
                response.get("JobId", "unknown"),
                response.get("RequestId", "unknown"),
                len(targets),
            )
        )
        return 0
    except EdgeOneError as error:
        print("EdgeOne purge failed: %s" % error, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
