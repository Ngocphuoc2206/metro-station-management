package com.backend.management_ticket_metro.service;

import com.backend.management_ticket_metro.common.ErrorCode;
import com.backend.management_ticket_metro.exception.AppException;
import com.backend.management_ticket_metro.service.S3_Storage.StorageService;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class QRCodeService {
    private final StorageService storageService;

    public String generateAndUploadTicketQR(String qrToken, String ticketCode){
        log.info("generateAndUploadTicketQr called: ticketCode={}, qrToken={}", ticketCode, qrToken);

        try{
            String qrContent = buildQrContent(qrToken);
            byte[] pngBytes = generateQrPng(qrContent);
            String uploadedUrl = storageService.uploadBytes(
                    pngBytes,
                    ticketCode + "-" + qrToken + ".png",
                    "image/png",
                    "tickets/qr"
            );

            log.info(
                    "generateAndUploadTicketQr success: ticketCode={}, fileName={}, uploadedUrl={}",
                    ticketCode, ticketCode + ".png", uploadedUrl
            );

            return uploadedUrl;
        } catch (Exception e) {
            log.error("generateAndUploadTicketQr failed: ticketCode={}", ticketCode, e);
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    private byte[] generateQrPng(String qrContent) throws Exception {
        log.info("generateQrPng called: content={}", qrContent);

        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.MARGIN, 1);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");

        BitMatrix bitMatrix = new MultiFormatWriter()
                .encode(qrContent, BarcodeFormat.QR_CODE, 300, 300, hints);

        BufferedImage image = toBufferedImage(bitMatrix);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(image, "png", outputStream);

        byte[] pngBytes = outputStream.toByteArray();
        log.info("generateQrPng success: content={}, byteSize={}", qrContent, pngBytes.length);

        return pngBytes;
    }

    private BufferedImage toBufferedImage(BitMatrix matrix) {
        int width = matrix.getWidth();
        int height = matrix.getHeight();

        log.info("toBufferedImage called: width={}, height={}", width, height);

        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

        Graphics2D graphics = image.createGraphics();
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, width, height);
        graphics.setColor(Color.BLACK);

        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                if (matrix.get(x, y)) {
                    image.setRGB(x, y, Color.BLACK.getRGB());
                }
            }
        }
        graphics.dispose();

        log.info("toBufferedImage success: width={}, height={}", width, height);
        return image;
    }

    private String buildQrContent(String qrToken) {
        String qrContent = "qr_token:" + qrToken;
        log.info("buildQrContent success: qrToken={}, qrContent={}", qrToken, qrContent);
        return qrContent;
    }

}
