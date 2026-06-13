package cn.gmkit.sm2;

import cn.gmkit.core.Bytes;
import cn.gmkit.core.GmkitException;
import cn.gmkit.core.Messages;
import org.bouncycastle.crypto.agreement.SM2KeyExchange;
import org.bouncycastle.crypto.params.ParametersWithID;
import org.bouncycastle.crypto.params.SM2KeyExchangePrivateParameters;
import org.bouncycastle.crypto.params.SM2KeyExchangePublicParameters;

final class SM2KeyAgreements {

    private SM2KeyAgreements() {
    }

    static byte[] keyExchange(
        String selfStaticPrivateKeyHex,
        String selfEphemeralPrivateKeyHex,
        String peerStaticPublicKeyHex,
        String peerEphemeralPublicKeyHex,
        SM2KeyExchangeOptions options) {
        SM2KeyExchangeOptions resolved = SM2Domain.keyExchangeOptions(options);
        SM2KeyExchange exchange = new SM2KeyExchange();
        exchange.init(new ParametersWithID(
            new SM2KeyExchangePrivateParameters(
                resolved.initiator(),
                SM2KeyOps.toPrivateKeyParameters(selfStaticPrivateKeyHex),
                SM2KeyOps.toPrivateKeyParameters(selfEphemeralPrivateKeyHex)),
            SM2Domain.userIdBytes(resolved.selfId())));
        return exchange.calculateKey(
            resolved.keyBits(),
            new ParametersWithID(
                new SM2KeyExchangePublicParameters(
                    SM2KeyOps.toPublicKeyParameters(peerStaticPublicKeyHex),
                    SM2KeyOps.toPublicKeyParameters(peerEphemeralPublicKeyHex)),
                SM2Domain.userIdBytes(resolved.peerId())));
    }

    static SM2KeyExchangeResult keyExchangeWithConfirmation(
        String selfStaticPrivateKeyHex,
        String selfEphemeralPrivateKeyHex,
        String peerStaticPublicKeyHex,
        String peerEphemeralPublicKeyHex,
        SM2KeyExchangeOptions options) {
        SM2KeyExchangeOptions resolved = SM2Domain.keyExchangeOptions(options);
        if (resolved.initiator() && (resolved.confirmationTag() == null || resolved.confirmationTag().length == 0)) {
            throw new GmkitException(Messages.sm2InitiatorConfirmationTagRequired());
        }
        SM2KeyExchange exchange = new SM2KeyExchange();
        exchange.init(new ParametersWithID(
            new SM2KeyExchangePrivateParameters(
                resolved.initiator(),
                SM2KeyOps.toPrivateKeyParameters(selfStaticPrivateKeyHex),
                SM2KeyOps.toPrivateKeyParameters(selfEphemeralPrivateKeyHex)),
            SM2Domain.userIdBytes(resolved.selfId())));
        byte[][] result = exchange.calculateKeyWithConfirmation(
            resolved.keyBits(),
            Bytes.clone(resolved.confirmationTag()),
            new ParametersWithID(
                new SM2KeyExchangePublicParameters(
                    SM2KeyOps.toPublicKeyParameters(peerStaticPublicKeyHex),
                    SM2KeyOps.toPublicKeyParameters(peerEphemeralPublicKeyHex)),
                SM2Domain.userIdBytes(resolved.peerId())));
        if (resolved.initiator()) {
            return new SM2KeyExchangeResult(result[0], null, result[1]);
        }
        return new SM2KeyExchangeResult(result[0], result[1], result[2]);
    }
}
