"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // ------------------ AUTH ------------------
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  // ------------------ FETCH ------------------
  const fetchBookmarks = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setBookmarks(data || []);
  };

  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  // ------------------ ADD ------------------
  const addBookmark = async () => {
    setErrorMsg("");
    setDuplicateId(null);

    if (!title || !url) return;

    const { data: existing } = await supabase
      .from("bookmarks")
      .select("id")
      .eq("url", url)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      setErrorMsg("URL already exists!");
      setDuplicateId(existing.id);
      return;
    }

    await supabase.from("bookmarks").insert({
      title,
      url,
      user_id: user.id,
    });

    setTitle("");
    setUrl("");
    fetchBookmarks();
  };

  // ------------------ DELETE ------------------
  const deleteBookmark = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    fetchBookmarks();
  };

  // ------------------ EDIT ------------------
  const startEdit = (b: any) => {
    setEditingId(b.id);
    setEditTitle(b.title);
    setEditUrl(b.url);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditUrl("");
  };

  const saveEdit = async (b: any) => {
    setErrorMsg("");
    setDuplicateId(null);

    if (editTitle === b.title && editUrl === b.url) {
      cancelEdit();
      return;
    }

    if (editUrl !== b.url) {
      const { data: existing } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("url", editUrl)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        setErrorMsg("URL already exists!");
        setDuplicateId(existing.id);
        return;
      }
    }

    await supabase
      .from("bookmarks")
      .update({ title: editTitle, url: editUrl })
      .eq("id", b.id);

    cancelEdit();
    fetchBookmarks();
  };

  // ------------------ SEARCH ------------------
  useEffect(() => {
    if (!search) setFiltered(bookmarks);
    else {
      const lower = search.toLowerCase();
      setFiltered(bookmarks.filter((b) => b.title.toLowerCase().includes(lower)));
    }
  }, [search, bookmarks]);

  // ------------------ UI ------------------
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">

      <div className="
    w-full 
    h-full 
    max-w-6xl 
    min-h-[90vh] 
    bg-white/70 
    backdrop-blur-xl 
    rounded-3xl 
    shadow-2xl 
    border border-white/40 
    p-6 
    flex 
    flex-col
  ">


        {/* Header */}
        <div className="mb-6">

          {/* Row 1 → Profile + Logout (mobile first) */}
          <div className="flex items-center justify-between sm:justify-end gap-3 mb-3 sm:mb-0">
            {!user ? (
              <button
                onClick={loginWithGoogle}
                className="bg-black text-white px-4 py-1 rounded"
              >
                Login with Google
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <img
                  src={user.user_metadata.avatar_url}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm font-medium">
                  {user.user_metadata.full_name}
                </span>
                <button
                  onClick={logout}
                  className="text-red-500 font-medium hover:bg-red-600 hover:text-white transition-all duration-150 ease-in-out delay-75 px-3 py-1"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Row 2 → Title (moves below only on small screens) */}
          <h1 className="
    text-2xl font-bold
    bg-gradient-to-r from-purple-600 to-pink-500
    bg-clip-text text-transparent
    sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:top-6
  ">
            My Bookmarks
          </h1>

        </div>


        {/* Add */}
        {user && (
          <>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">

              <input
                className="border p-2 w-full rounded"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <input
                className="border p-2 w-full rounded"
                placeholder="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />

              <button
                onClick={addBookmark}
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-blue-800 w-full sm:w-auto"
              >
                Add
              </button>

            </div>


            {errorMsg && <p className="text-red-500 text-sm mb-3">{errorMsg}</p>}

            {/* Search */}
            <div className="relative mb-4">
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>

              <input
                className="border p-2 pl-9 w-full rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                placeholder="Search bookmarks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

          </>
        )}

        {/* List */}
        {user &&
          filtered.map((b) => (
            <div
              key={b.id}
              className={`bg-white/90
  backdrop-blur
  p-4
  rounded-xl
  shadow-sm
  hover:shadow-md
  hover:scale-[1.01]
  transition
  mb-3 ${duplicateId === b.id ? "border border-red-500" : ""
                }`}
            >
              {editingId === b.id ? (
                <>
                  <input
                    className="border p-1 w-full mb-2"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                  <input
                    className="border p-1 w-full mb-2"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                  />
                  <div className="flex gap-3 mt-1">
                    <button
                      onClick={() => saveEdit(b)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:scale-105 transition"
                    >
                      Save
                    </button>

                    <button
                      onClick={cancelEdit}
                      className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>

                </>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                    {/* Title */}
                    <a
                      href={b.url}
                      target="_blank"
                      className="text-blue-600 font-medium text-lg"
                    >
                      {b.title}
                    </a>

                    {/* Desktop buttons */}
                    <div className="hidden sm:flex gap-4">
                      <button
                        onClick={() => startEdit(b)}
                        className="text-yellow-600 hover:bg-amber-600 hover:text-white px-3 py-1 rounded transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteBookmark(b.id)}
                        className="text-red-500 hover:bg-red-600 hover:text-white px-3 py-1 rounded transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>


                  <p className="text-xs text-gray-500 mt-1">
                    {mounted
                      ? b.updated_at
                        ? `Updated: ${new Date(b.updated_at).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}`
                        : `Created: ${new Date(b.created_at).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}`
                      : ""}
                  </p>

                  <div className="flex sm:hidden gap-4 mt-3">
                    <button
                      onClick={() => startEdit(b)}
                      className="text-yellow-600 hover:bg-amber-600 hover:text-white px-3 py-1 rounded transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteBookmark(b.id)}
                      className="text-red-500 hover:bg-red-600 hover:text-white px-3 py-1 rounded transition"
                    >
                      Delete
                    </button>
                  </div>


                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
