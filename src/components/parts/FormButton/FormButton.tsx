type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export const FormButton = ({ label, ...props }: Props) => {
  return (
    <button
      {...props}
      className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {label}
    </button>
  );
};
