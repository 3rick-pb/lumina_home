import React from "react";

export function GoogleWalletIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fillRule="evenodd"
      strokeLinejoin="round"
      strokeMiterlimit="2"
      clipRule="evenodd"
      viewBox="0 0 512 512"
      className={`shrink-0 ${className}`}
    >
      <path
        fill="#34a853"
        d="M510.992 192.735V107.73c0-49.084-36.4-89.087-81.06-89.087H82.082C37.398 19.09 1 59.093 1 107.73v85.004c0 8.634 6.212 15.462 14.069 15.462h481.876c7.856 0 14.047-6.828 14.047-15.462z"
      />
      <path
        fill="#fbbc04"
        d="M510.992 267.298V182.74c0-49.107-36.4-89.11-81.06-89.11H82.082C37.398 93.63 1 133.633 1 182.74v85.004c0 8.634 6.212 15.462 14.069 15.462h481.876c7.856-.47 14.047-7.274 14.047-15.908"
      />
      <path
        fill="#ea4335"
        d="M510.992 342.308v-85.005c0-49.106-36.4-89.11-81.06-89.11H82.082C37.398 168.193 1 208.197 1 257.303v85.005c0 8.634 6.212 15.438 14.069 15.438h481.876c7.856-.446 14.047-7.273 14.047-15.438"
      />
      <path
        fill="#4285f4"
        d="M325.282 301.39 1 218.66v187.278c0 49.106 36.399 89.11 81.081 89.11h347.851c44.66 0 81.06-40.004 81.06-89.11V215.024l-77.345 61.823c-31.425 24.988-70.728 34.091-108.365 24.542z"
      />
    </svg>
  );
}

export interface GoogleWalletButtonProps {
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  topText?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Pure code implementation of the official Google Wallet button badge.
 * Designed pixel-accurately without relying on image assets or background crops.
 */
export function GoogleWalletButton({
  onClick,
  href,
  target,
  rel,
  topText = "Add to",
  className = "",
  disabled = false,
}: GoogleWalletButtonProps) {
  const content = (
    <>
      <GoogleWalletIcon className="w-8 h-8 sm:w-9 sm:h-9" />
      <div className="flex flex-col items-start justify-center leading-none text-left">
        <span className="text-[12px] sm:text-[13px] font-normal text-white/95 tracking-normal leading-tight font-sans">
          {topText}
        </span>
        <span className="text-[17px] sm:text-[19px] font-medium text-white tracking-tight leading-tight font-sans">
          Google Wallet
        </span>
      </div>
    </>
  );

  const baseStyles =
    "inline-flex items-center justify-center gap-3 sm:gap-3.5 px-6 sm:px-7 py-2.5 min-h-[50px] sm:min-h-[54px] rounded-full bg-[#1F1F1F] hover:bg-[#2C2C2C] active:bg-[#191919] text-white shadow-[0_4px_16px_rgba(0,0,0,0.35)] transition-all duration-200 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20 active:scale-[0.98]";

  if (href && !disabled) {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noopener noreferrer" : rel}
        onClick={onClick}
        className={`${baseStyles} ${className}`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
    >
      {content}
    </button>
  );
}

export default GoogleWalletButton;
