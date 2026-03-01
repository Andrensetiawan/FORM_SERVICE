"use client";

import React from "react";

interface Props {
  serviceData: any;
  className?: string;
  isReadOnly?: boolean;
}

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 4) return phone;
  return `********${phone.slice(-4)}`;
};

export default function PaymentSection({
  serviceData,
  className,
  isReadOnly,
}: Props) {
  const qrCodeUrl = "/QR.jpeg";

  return (
    <section className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-blue-600">Pembayaran via QR</h3>
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="w-72 h-72 flex-shrink-0">
          <img src={qrCodeUrl} alt="QR Code for payment" className="w-full h-full object-contain" />
        </div>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">ID:</span> {serviceData?.track_number}
          </p>
          <p>
            <span className="font-semibold">Nama:</span> {serviceData?.nama}
          </p>
          <p>
            <span className="font-semibold">Telepon:</span> {isReadOnly ? maskPhone(serviceData?.no_hp) : serviceData?.no_hp}
          </p>
          <p className="text-lg font-bold">
            <span className="font-semibold">Jumlah:</span> Rp {serviceData?.total_biaya?.toLocaleString("id-ID")}
          </p>
          <div className="pt-4">
            <h4 className="font-semibold text-md text-gray-800">Atau transfer manual ke:</h4>
            <p className="text-gray-600">
              <span className="font-semibold">Bank:</span> BCA
              <br />
              <span className="font-semibold">No. Rekening:</span> 676-034-1507 (a.n. Fitra Erlinar M)
              <br />
              <span className="font-semibold">Berita Transfer:</span> {serviceData?.track_number} (a.n. Fitra Erlinar M)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
