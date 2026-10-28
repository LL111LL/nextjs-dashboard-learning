export default function LoginForm() {
  return (
    <form className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          电子邮箱
        </label>

        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="请输入电子邮箱"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-zinc-700"
        >
          密码
        </label>

        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="请输入密码"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
      >
        登录
      </button>
    </form>
  );
}