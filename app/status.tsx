import clsx from "clsx";

type StatusProps = {
  status: "pending" | "completed";
};

export default function Status({ status }: StatusProps) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-3 py-1 text-sm font-medium",
        {
          "bg-yellow-100 text-yellow-700": status === "pending",
          "bg-green-100 text-green-700": status === "completed",
        },
      )}
    >
      {status === "pending" ? "待处理" : "已完成"}
    </span>
  );
}