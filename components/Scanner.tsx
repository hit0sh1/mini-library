"use client";

import React, { useEffect, useRef, useState } from "react";
import Quagga from "@ericblade/quagga2";

interface ScannerProps {
  onDetected: (result: string) => void;
}

const Scanner: React.FC<ScannerProps> = ({ onDetected }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const initScanner = async () => {
      if (!scannerRef.current) return;

      // Debugging logs to help identify the environment issue
      console.log("[Scanner] Environment Check:", {
        isSecureContext: window.isSecureContext,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!(
          navigator.mediaDevices && navigator.mediaDevices.getUserMedia
        ),
        userAgent: navigator.userAgent,
      });

      // Give the DOM a moment to stabilize
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (!isActive) return;

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("getUserMedia_undefined");
        }

        Quagga.init(
          {
            inputStream: {
              type: "LiveStream",
              constraints: {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "environment",
              },
              target: scannerRef.current,
            },
            locator: {
              patchSize: "medium",
              halfSample: true,
            },
            numOfWorkers: Math.min(navigator.hardwareConcurrency || 2, 4),
            decoder: {
              readers: ["ean_reader"],
              multiple: false,
            },
            locate: true,
          },
          (err) => {
            if (err) {
              if (isActive) {
                console.error("Quagga init error:", err);
                if (
                  err.name === "NotAllowedError" ||
                  err.name === "PermissionDeniedError"
                ) {
                  setError(
                    "カメラへのアクセスが拒否されました。設定を確認してください。",
                  );
                } else {
                  setError("スキャナーの初期化に失敗しました。");
                }
              }
              return;
            }
            if (isActive) {
              console.log("[Scanner] Quagga started");
              Quagga.start();
            }
          },
        );

        let lastResult: string | null = null;
        let count = 0;

        Quagga.onDetected((result) => {
          if (isActive && result?.codeResult?.code) {
            const code = result.codeResult.code;
            if (code.length !== 13) return;

            if (code === lastResult) {
              count++;
            } else {
              lastResult = code;
              count = 0;
            }

            if (count >= 5) {
              onDetected(code);
              lastResult = null;
              count = 0;
            }
          }
        });
      } catch (err: any) {
        console.error("Scanner setup failed:", err);
        if (isActive) {
          if (err.message === "getUserMedia_undefined") {
            setError(
              "ブラウザがカメラに対応していないか、HTTPS接続ではありません。localhost以外でテストする場合はHTTPSが必要です。",
            );
          } else {
            setError("スキャナーの起動中にエラーが発生しました。");
          }
        }
      }
    };

    initScanner();

    return () => {
      isActive = false;
      Quagga.stop();
      Quagga.offDetected();
    };
  }, [onDetected]);

  return (
    <div className="relative w-full h-80 bg-black rounded-lg overflow-hidden">
      {error ? (
        <div className="flex items-center justify-center h-full text-white p-4 text-center">
          {error}
        </div>
      ) : (
        <div
          ref={scannerRef}
          className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
        />
      )}
      {/* Visual Guide Box */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[80%] h-[40%] border-2 border-indigo-500 rounded-lg shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 opacity-70" />
        </div>
        <p className="absolute bottom-6 text-white text-[10px] font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          この枠内にバーコードを合わせてください
        </p>
      </div>
    </div>
  );
};

export default Scanner;
