type Props = {
  password: string;
};

type StrengthLevel = {
  label: string;
  color: string;
  width: string;
};

function getStrength(password: string): StrengthLevel {
  if (!password) return { label: "", color: "", width: "0%" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Yếu", color: "bg-red-400", width: "33%" };
  if (score <= 3) return { label: "Trung bình", color: "bg-yellow-400", width: "66%" };
  return { label: "Mạnh", color: "bg-green-500", width: "100%" };
}

export default function PasswordStrengthIndicator({ password }: Props) {
  const { label, color, width } = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width }}
        />
      </div>
      {label && (
        <p className="text-xs text-gray-400 mt-1">
          Độ mạnh mật khẩu:{" "}
          <span
            className={
              label === "Mạnh"
                ? "text-green-500 font-medium"
                : label === "Trung bình"
                ? "text-yellow-500 font-medium"
                : "text-red-400 font-medium"
            }
          >
            {label}
          </span>
        </p>
      )}
    </div>
  );
}
