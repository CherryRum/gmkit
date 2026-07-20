import json
import unittest

import purge_edgeone


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def read(self):
        return json.dumps(self.payload).encode("utf-8")


class EdgeOneClientTest(unittest.TestCase):
    def test_signed_global_request_contains_expected_contract(self):
        request = purge_edgeone.build_request(
            "secret-id",
            "secret-key",
            "zone-id",
            ["gmkit.cn", "www.gmkit.cn"],
            "global",
            timestamp=1_700_000_000,
        )

        self.assertEqual(request.full_url, "https://teo.intl.tencentcloudapi.com/")
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(request.headers["X-tc-action"], "CreatePurgeTask")
        self.assertIn("Credential=secret-id/", request.headers["Authorization"])
        self.assertEqual(
            json.loads(request.data),
            {
                "ZoneId": "zone-id",
                "Type": "purge_host",
                "Targets": ["gmkit.cn", "www.gmkit.cn"],
            },
        )

    def test_api_error_fails(self):
        request = purge_edgeone.build_request(
            "id", "key", "zone", ["gmkit.cn"], "cn", timestamp=1
        )

        def opener(_request, timeout):
            self.assertEqual(timeout, 20)
            return FakeResponse(
                {"Response": {"Error": {"Code": "AuthFailure", "Message": "denied"}}}
            )

        with self.assertRaisesRegex(purge_edgeone.EdgeOneError, "AuthFailure"):
            purge_edgeone.send_request(request, opener=opener)

    def test_failed_target_fails(self):
        request = purge_edgeone.build_request(
            "id", "key", "zone", ["gmkit.cn"], "cn", timestamp=1
        )

        def opener(_request, timeout):
            self.assertEqual(timeout, 20)
            return FakeResponse(
                {"Response": {"RequestId": "r1", "FailedList": ["gmkit.cn"]}}
            )

        with self.assertRaisesRegex(purge_edgeone.EdgeOneError, "rejected targets"):
            purge_edgeone.send_request(request, opener=opener)


if __name__ == "__main__":
    unittest.main()
