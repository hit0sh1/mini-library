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
    if (!scannerRef.current) return;

    Quagga.init(
      {
        inputStream: {
          type: "LiveStream",
          constraints: {
            width: 640,
            height: 480,
            facingMode: "environment", // Use rear camera
          },
          target: scannerRef.current,
        },
        locator: {
          patchSize: "medium",
          halfSample: true,
        },
        numOfWorkers: 2,
        decoder: {
          readers: ["ean_reader"], // ISBN is EAN-13
        },
        locate: true,
      },
      (err) => {
        if (err) {
          console.error("Error starting Quagga:", err);
          setError(
            "カメラへのアクセスに失敗しました。権限を確認してください。",
          );
          return;
        }
        Quagga.start();
      },
    );

    Quagga.onDetected((result) => {
      if (result && result.codeResult && result.codeResult.code) {
        onDetected(result.codeResult.code);
        Quagga.stop(); // Stop after detection to prevent multiple reads
      }
    });

    return () => {
      Quagga.stop();
    };
  }, [onDetected]);

  return (
    <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
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
      <div className="absolute inset-0 border-2 border-white/50 pointer-events-none">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 opacity-50" />
      </div>
    </div>
  );
};

export default Scanner;
