"use client";

// Consistent section title: small eyebrow, large heading, short brand underline,
// optional right-side slot (countdown, link…).
export default function SectionHeading({
  eyebrow,
  title,
  right,
  light = false,
  align = "left"
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
  light?: boolean; // for use on dark panels
  align?: "left" | "center";
}) {
  const center = align === "center";
  return (
    <div className={`mb-5 flex items-end justify-between gap-3 ${center ? "flex-col items-center text-center" : ""}`}>
      <div className={center ? "flex flex-col items-center" : ""}>
        {eyebrow && (
          <span className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald">
            <span className="h-px w-5 bg-gradient-to-r from-emerald to-[#FFC400]" />
            {eyebrow}
          </span>
        )}
        <h2
          className={`text-[22px] font-extrabold leading-tight tracking-tight sm:text-3xl ${
            light ? "text-white" : "text-[#17120E] dark:text-white"
          }`}
        >
          {(() => {
            const words = title.split(" ");
            if (words.length < 2) return <span className="text-gradient-brand">{title}</span>;
            const last = words.pop() as string;
            return (
              <>
                {words.join(" ")} <span className="text-gradient-brand">{last}</span>
              </>
            );
          })()}
        </h2>
        <span className="mt-2 block h-1 w-10 rounded-full bg-gradient-to-r from-emerald to-[#FFC400]" />
      </div>
      {right}
    </div>
  );
}
