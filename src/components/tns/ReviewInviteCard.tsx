import React from "react";

type Props = {
  customerName?: string;
  customerPhone?: string;
};

const REVIEW_LINK = "https://search.google.com/local/writereview?placeid=ChIJ3fTY-qVFoU0RH-jnY2X1IrM";

const ReviewInviteCard: React.FC<Props> = ({ customerName, customerPhone }) => {
  const reviewDisplayName = customerName?.trim() || "Customer";
  const sanitizedPhone = customerPhone?.replace(/\D/g, "") || "";
  const reviewMessage = `Halo ${reviewDisplayName}! Terima kasih sudah mempercayakan perbaikan di Hibatillah Cyber. Mohon bantuannya memberikan ulasan melalui tautan berikut: ${REVIEW_LINK}`;
  const encodedReviewMessage = encodeURIComponent(reviewMessage);
  const waUrl = sanitizedPhone
    ? `https://wa.me/${sanitizedPhone}?text=${encodedReviewMessage}`
    : `https://wa.me/?text=${encodedReviewMessage}`;

  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-green-900 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-base font-semibold">Kirim Ulasan Customer</p>
        <p className="text-sm text-green-800 mt-1">
          Ajak {reviewDisplayName} memberikan ulasan setelah perangkat dikembalikan.
        </p>
      </div>
      <div className="flex flex-col gap-1 sm:items-end">
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-green-700"
        >
          Kirim ulasan ke {reviewDisplayName}
        </a>
        <span className="text-xs text-green-700">
          Tautan ulasan: <a href={REVIEW_LINK} target="_blank" rel="noreferrer" className="underline">Hibatillah Cyber</a>
        </span>
      </div>
    </div>
  );
};

export default ReviewInviteCard;
