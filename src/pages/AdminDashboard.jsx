import { useEffect, useState } from "react";
import { supabaseAdmin } from "../supabaseAdmin";
import { supabase } from "../supabaseClient";
import { updateUserMetaData } from "../lib/updateUserMetaData";

const AdminDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [currentLoggeInUser, setCurrentLoggeInUser] = useState();
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "manager",
  });

  const handleChange = (e) => {
    const { value, name } = e.target;
    console.log(`changing ${name}: ${value}`);
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    validateCurrentLogeInUser();
    initUsers();
  }, []);

  const validateCurrentLogeInUser = async () => {
    const { data: userAuth } = await supabase.auth.getSession();
    console.log("userAuth: ", userAuth);
    const { data: user } = await supabase.auth.getUser();
    console.log("user: ", user.user.id);
    setCurrentLoggeInUser(user);
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.user.id)
      .single();
    if (profile?.role === "admin") {
      console.log("validateCurrentLogeInUser: ", profile);
      setIsAdmin(true);
      initUsers();
    }
  };

  const initUsers = async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*");

    if (error) return console.error("error initusers: ", error);
    setProfiles(profiles);
    console.log("profiles:", profiles);
  };

  const handleCreateuser = async () => {
    console.log("form: ", form);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true,
      app_metadata: {
        role: form.role,
      },
      user_metadata: {
        role: form.role,
      },
    });

    if (error) return console.error("createing user error: ", error);

    if (!data.user) return console.error("no data use found: ");

    console.log("handleCreateuser: ", data);

    const { error: insertError } = await supabase.from("profiles").insert([
      {
        id: data.user.id,
        email: data.user.email,
        role: form.role,
      },
    ]);

    if (insertError) return console.error("profile insert error", insertError);

    console.log("succesfully signed up");
    initUsers();
  };

  const handleUpdateRole = async (id, role) => {
    console.log("parameters", id, role);
    const { data, error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (error) return console.error("error update: ", error);
    console.log("handleUpdateRole: ", data);

    if (role === "admin") await updateUserMetaData(id, role);

    initUsers();
  };

  const handledeleteUser = async (id) => {
    console.log("parameters", id);
    const { data, error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) return console.error("error delete: ", error);
    console.log("handledeleteUser: ", data);

    const { error: deleteUserFromAuthError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteUserFromAuthError)
      return console.error(
        "deleteUserFromAuthError: ",
        deleteUserFromAuthError
      );

    initUsers();
  };

  if (!isAdmin) return <p className="text-center mt-10">access denied</p>;

  return (
    <div className="flex mx-20">
      <div className="flex flex-col">
        <div>
          <h1 className="text-xl mb-10"> admin user management</h1>
        </div>

        <div></div>

        <div className="">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreateuser();
            }}
            className="flex flex-col gap-y-5"
          >
            add users
            <input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="border"
            />
            <input
              name="password"
              placeholder="Password"
              type="password"
              className="border"
              value={form.password}
              onChange={handleChange}
            />
            <select
              name="role"
              className="border rounded p-2"
              value={form.role}
              onChange={handleChange}
            >
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
            <button type="submit" className="border cursor-pointer">
              add
            </button>
          </form>
        </div>

        <div>
          <table className="w-full text-left border mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((user) =>
                user.email === currentLoggeInUser?.user?.email ? (
                  ""
                ) : (
                  <tr key={user.id} className="border-t">
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleUpdateRole(user.id, e.target.value)
                        }
                        className="border rounded p-1"
                      >
                        <option value="manager">manager</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handledeleteUser(user.id)}
                        className="border cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
