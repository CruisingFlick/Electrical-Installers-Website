import { useListBlogPosts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import { BookOpen, Calendar, Tag, ArrowRight } from "lucide-react";

const CATEGORIES = ["All", "Tips", "Guides", "Safety", "News"];

export default function BlogPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { data: posts = [], isLoading } = useListBlogPosts(
    category ? { category: category.toLowerCase() } : undefined
  );

  return (
    <div>
      <div className="bg-[hsl(214,60%,14%)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Electrical Tips &amp; Guides</h1>
          <p className="text-gray-300 text-lg max-w-xl">
            Practical advice from our licensed electricians — helping you understand your home's electrical system.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          {CATEGORIES.map((cat) => {
            const val = cat === "All" ? undefined : cat.toLowerCase();
            const isActive = (val === undefined && category === undefined) || val === category;
            return (
              <button
                key={cat}
                onClick={() => setCategory(val)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[hsl(25,95%,53%)] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-100 rounded-2xl animate-pulse h-64" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-[hsl(214,60%,14%)] mb-2">No articles yet</h3>
            <p className="text-gray-500">Check back soon for tips and electrical guides.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
                data-testid={`blog-post-${post.id}`}
              >
                {post.imageUrl ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-[hsl(214,60%,14%)] to-[hsl(214,50%,24%)] flex items-center justify-center">
                    <BookOpen size={40} className="text-white/40" />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex items-center gap-1 text-xs text-[hsl(25,95%,53%)] font-semibold capitalize">
                      <Tag size={11} />
                      {post.category}
                    </span>
                    {post.publishedAt && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={11} />
                        {new Date(post.publishedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-[hsl(214,60%,14%)] mb-2 group-hover:text-[hsl(25,95%,53%)] transition-colors leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed flex-1">{post.excerpt}</p>
                  <div className="flex items-center gap-1 text-sm font-semibold text-[hsl(25,95%,53%)] mt-4">
                    Read more <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
