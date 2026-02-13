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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-xl backdrop-blur-lg bg-white/70 shadow-2xl rounded-2xl p-6 border border-white/40">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            My Bookmarks
          </h1>

          {!user ? (
            <button onClick={loginWithGoogle} className="bg-black text-white px-4 py-1 rounded">
              Login with Google
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <img src={user.user_metadata.avatar_url} className="w-8 h-8 rounded-full" />
              <span className="text-sm font-medium">{user.user_metadata.full_name}</span>
              <button onClick={logout} className="text-red-500 font-medium">Logout</button>
            </div>
          )}
        </div>

        {/* Add */}
        {user && (
          <>
            <div className="flex gap-2 mb-2">
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
              <button onClick={addBookmark} className="bg-purple-500 text-white px-4 rounded">
                Add
              </button>
            </div>

            {errorMsg && <p className="text-red-500 text-sm mb-3">{errorMsg}</p>}

            {/* Search */}
            <input
              className="border p-2 w-full rounded mb-4"
              placeholder="Search bookmarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </>
        )}

        {/* List */}
        {user &&
          filtered.map((b) => (
            <div
              key={b.id}
              className={`p-3 rounded mb-2 shadow bg-white ${
                duplicateId === b.id ? "border border-red-500" : ""
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
                  <div className="flex gap-3">
                    <button onClick={() => saveEdit(b)} className="text-green-600">Save</button>
                    <button onClick={cancelEdit} className="text-gray-500">Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <a href={b.url} target="_blank" className="text-blue-600">{b.title}</a>
                    <div className="flex gap-4">
                      <button onClick={() => startEdit(b)} className="text-yellow-600">Edit</button>
                      <button onClick={() => deleteBookmark(b.id)} className="text-red-500">Delete</button>
                    </div>
                  </div>

                  {mounted && (
                    <p className="text-xs text-gray-500 mt-1">
                      {b.updated_at
                        ? `Updated: ${new Date(b.updated_at).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}`
                        : `Created: ${new Date(b.created_at).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}`}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
