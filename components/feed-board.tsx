"use client"

import { useState, useTransition } from "react"
import { createPost, addComment } from "@/app/actions/feed"

interface Comment {
  id: string
  content: string
  createdAt: Date
  user: { displayName: string }
}

interface Post {
  id: string
  content: string
  createdAt: Date
  user: { displayName: string }
  comments: Comment[]
}

interface FeedBoardProps {
  userId: string
  initialPosts: Post[]
}

function timeAgo(date: Date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return "เมื่อสักครู่"
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`
  return `${Math.floor(diff / 86400)} วันที่แล้ว`
}

function PostCard({
  post,
  userId,
}: {
  post: Post
  userId: string
}) {
  const [showComments, setShowComments] = useState(false)
  const [commentInput, setCommentInput] = useState("")
  const [comments, setComments] = useState(post.comments)
  const [isPending, startTransition] = useTransition()

  function handleComment() {
    const trimmed = commentInput.trim()
    if (!trimmed) return

    const optimistic: Comment = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      createdAt: new Date(),
      user: { displayName: "..." },
    }
    setComments((prev) => [...prev, optimistic])
    setCommentInput("")

    startTransition(async () => {
      await addComment({ postId: post.id, userId, content: trimmed })
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      {/* Post header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
          <span className="text-xs font-medium text-gray-600">
            {post.user.displayName[0]?.toUpperCase() ?? "?"}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{post.user.displayName}</p>
          <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>

      {/* Comment toggle */}
      <button
        onClick={() => setShowComments((v) => !v)}
        className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        {comments.length > 0 ? `ความคิดเห็น ${comments.length}` : "แสดงความคิดเห็น"}
      </button>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 space-y-2 border-t border-gray-50 pt-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-medium text-gray-500">
                  {c.user.displayName[0]?.toUpperCase() ?? "?"}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-700">{c.user.displayName} </span>
                <span className="text-xs text-gray-600">{c.content}</span>
              </div>
            </div>
          ))}

          <div className="flex gap-2 mt-2">
            <input
              className="flex-1 text-xs border border-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder-gray-300"
              placeholder="เขียนความคิดเห็น..."
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleComment()}
              disabled={isPending}
            />
            <button
              onClick={handleComment}
              disabled={isPending || !commentInput.trim()}
              className="px-3 py-2 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              ส่ง
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function FeedBoard({ userId, initialPosts }: FeedBoardProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [postInput, setPostInput] = useState("")
  const [isPending, startTransition] = useTransition()

  function handlePost() {
    const trimmed = postInput.trim()
    if (!trimmed) return

    setPostInput("")
    startTransition(async () => {
      await createPost({ userId, content: trimmed })
    })
  }

  return (
    <div className="space-y-4">
      {/* New post */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <textarea
          className="w-full text-sm text-gray-800 placeholder-gray-300 border border-gray-100 rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
          rows={3}
          placeholder="แชร์อะไรกับทีม..."
          value={postInput}
          onChange={(e) => setPostInput(e.target.value)}
          disabled={isPending}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handlePost}
            disabled={isPending || !postInput.trim()}
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
          >
            โพสต์
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 && !isPending ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <p className="text-sm text-gray-400">ยังไม่มีโพสต์ เริ่มแชร์เลย</p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} userId={userId} />)
      )}
    </div>
  )
}
