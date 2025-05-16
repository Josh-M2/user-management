import { useState } from "react";
import { supabase } from "../supabaseClient";
import { supabaseAdmin } from "../supabaseAdmin";
import { useNavigate } from "react-router-dom";
import { updateUserMetaData } from "../lib/updateUserMetaData";

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    repassword: "",
  });

  const [error, setError] = useState({
    emailError: "",
    passwordError: "",
    repasswordError: "",
  });

  const handleChange = (e) => {
    const { value, name } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password, repassword) => {
    if (password !== repassword) {
      return "Passwords do not match";
    }
    return "";
  };

  const handleSubmitSignup = async () => {
    const { email, password, repassword } = form;
    const repasswordError = validatePassword(password, repassword);
    const role = "admin";

    if (repasswordError) {
      setError((prev) => ({
        ...prev,
        repasswordError: repasswordError,
      }));
      return;
    }
    setError({ emailError: "", passwordError: "", repasswordError: "" });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return console.error("signup error: ", error);

    if (!data.user) return console.error("no data use found: ");

    console.log("signup user: ", data.user);

    const { error: insertError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        email: data.user.email,
        role: role,
      },
    ]);

    if (insertError) return console.error("profile insert error", insertError);

    await updateUserMetaData(data.user.id, role);

    console.log("succesfully signed up");

    // const { error: errorSignIN } = await supabase.auth.signInWithPassword({
    //   email,
    //   password,
    // });

    // if (errorSignIN) {
    //   return console.error("errorSignIN: ", errorSignIN);
    // } else {
    //   navigate("/admindashboard");
    // }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <img
          alt="Your Company"
          src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
          className="mx-auto h-10 w-auto"
        />
        <h2 className="mt-10 text-center text-2xl font-bold tracking-tight text-gray-900">
          Register your account
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmitSignup();
          }}
          className="space-y-6"
        >
          {error.repasswordError && (
            <p className="text-red-600 text-sm">{error.repasswordError}</p>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-900"
            >
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-900"
            >
              Password
            </label>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                value={form.password}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="repassword"
              className="block text-sm font-medium text-gray-900"
            >
              Confirm Password
            </label>
            <div className="mt-2">
              <input
                id="repassword"
                name="repassword"
                type="password"
                required
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 border border-gray-300 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                value={form.repassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              Sign up
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <a
            href="/"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
