export const users = [
  {
    id: "410544b2-4001-4271-9855-fec4b6a6442a",
    name: "测试用户",
    email: "user@example.com",
    password: "demo12345",
  },
];

export const customers = [
  {
    id: "3958dc9e-712f-4377-85e9-fec4b6a6442a",
    name: "张三",
    email: "zhangsan@example.com",
    imageUrl: "/globe.svg",
  },
  {
    id: "3958dc9e-742f-4377-85e9-fec4b6a6442a",
    name: "李四",
    email: "lisi@example.com",
    imageUrl: "/window.svg",
  },
  {
    id: "3958dc9e-787f-4377-85e9-fec4b6a6442a",
    name: "王五",
    email: "wangwu@example.com",
    imageUrl: "/file.svg",
  },
];

export const invoices = [
  {
    customerId: customers[0].id,
    amount: 15795,
    status: "pending",
    date: "2026-10-01",
  },
  {
    customerId: customers[1].id,
    amount: 20348,
    status: "paid",
    date: "2026-10-05",
  },
  {
    customerId: customers[2].id,
    amount: 30400,
    status: "pending",
    date: "2026-10-12",
  },
  {
    customerId: customers[0].id,
    amount: 44800,
    status: "paid",
    date: "2026-10-20",
  },
];

export const revenue = [
  { month: "Jan", revenue: 2000 },
  { month: "Feb", revenue: 1800 },
  { month: "Mar", revenue: 2200 },
  { month: "Apr", revenue: 2500 },
  { month: "May", revenue: 2300 },
  { month: "Jun", revenue: 3200 },
  { month: "Jul", revenue: 3500 },
  { month: "Aug", revenue: 3700 },
  { month: "Sep", revenue: 4100 },
  { month: "Oct", revenue: 4300 },
  { month: "Nov", revenue: 4800 },
  { month: "Dec", revenue: 5000 },
];