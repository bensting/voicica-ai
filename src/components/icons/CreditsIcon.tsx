interface CreditsIconProps {
  className?: string;
}

export default function CreditsIcon({ className = "w-6 h-6" }: CreditsIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 钱袋主体 */}
      <path
        d="M12 4C10.5 4 9.5 5 9 6H15C14.5 5 13.5 4 12 4Z"
        fill="currentColor"
        opacity="0.2"
      />

      {/* 钱袋身体 */}
      <path
        d="M8 7C6.5 7 5.5 8 5 10C4.5 12 4 14.5 4.5 17C5 19.5 6 21 8 21H16C18 21 19 19.5 19.5 17C20 14.5 19.5 12 19 10C18.5 8 17.5 7 16 7H8Z"
        fill="currentColor"
      />

      {/* 钱袋顶部系带 */}
      <path
        d="M9 6C9.5 5 10.5 4 12 4C13.5 4 14.5 5 15 6H16.5C16.5 6 15.5 3 12 3C8.5 3 7.5 6 7.5 6H9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* 钱袋轮廓 */}
      <path
        d="M8 7H16C17.5 7 18.5 8 19 10C19.5 12 20 14.5 19.5 17C19 19.5 18 21 16 21H8C6 21 5 19.5 4.5 17C4 14.5 4.5 12 5 10C5.5 8 6.5 7 8 7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* 星星 */}
      <path
        d="M12 10L12.9 12.4L15.5 12.8L13.6 14.5L14.2 17L12 15.7L9.8 17L10.4 14.5L8.5 12.8L11.1 12.4L12 10Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}