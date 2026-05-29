"use client";

import Image from "next/image";

export function LineConnectCard({ botHandle }: { botHandle: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-5 bg-muted/20 rounded-xl border border-border/50">
      <div className="bg-white rounded-lg p-3 mb-3 inline-flex shadow-sm border border-border/50">
        <Image
          src="/line-qr-placeholder.png"
          alt="LINE QR Code"
          width={150}
          height={150}
          className="rounded-sm"
        />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        Add <span className="text-primary font-bold">{botHandle}</span> on LINE
      </p>
      <p className="text-xs text-muted-foreground text-center">
        Scan the QR code above, then send your <br className="hidden sm:block"/>
        6-digit code in the chat to link your account.
      </p>
    </div>
  );
}
