import { useGetBlogPost, getGetBlogPostQueryKey, useListBlogPosts } from "@workspace/api-client-react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Calendar, Tag, BookOpen, Phone, ArrowRight } from "lucide-react";
import { useJsonLd } from "@/hooks/useJsonLd";

const PUBLISHER = {
  "@type": "Organization",
  "@id": "https://www.electricalinstallers.com.au/#business",
  "name": "Electrical Installers",
  "url": "https://www.electricalinstallers.com.au",
} as const;

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug ?? "";
  const { data: post, isLoading, error } = useGetBlogPost(slug, { query: { queryKey: getGetBlogPostQueryKey(slug), enabled: !!slug } });
  const { data: allPosts = [] } = useListBlogPosts();
  const related = allPosts
    .filter((p) => p.slug !== slug)
    .sort((a, b) => (a.category === post?.category ? -1 : 0) - (b.category === post?.category ? -1 : 0))
    .slice(0, 3);

  const pageUrl = `https://www.electricalinstallers.com.au/blog/${slug}`;
  useJsonLd(post ? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl },
    "headline": post.title,
    "description": post.excerpt ?? undefined,
    ...(post.imageUrl ? { "image": post.imageUrl } : {}),
    ...(post.publishedAt ? { "datePublished": post.publishedAt } : {}),
    "publisher": PUBLISHER,
    "author": PUBLISHER,
  } : null);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-64 bg-gray-100 rounded-2xl" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-4 bg-gray-100 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-[hsl(214,60%,14%)] mb-2">Article Not Found</h1>
        <p className="text-gray-500 mb-6">This article doesn't exist or has been removed.</p>
        <Link href="/blog" className="inline-flex items-center gap-2 text-[hsl(25,95%,53%)] font-semibold hover:underline">
          <ArrowLeft size={16} />
          Back to all articles
        </Link>
      </div>
    );
  }

  return (
    <div>
      {post.imageUrl && (
        <div className="w-full h-72 sm:h-96 overflow-hidden">
          <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[hsl(25,95%,53%)] font-medium hover:underline mb-6">
          <ArrowLeft size={15} />
          All articles
        </Link>

        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <span className="flex items-center gap-1 text-sm text-[hsl(25,95%,53%)] font-semibold capitalize">
            <Tag size={13} />
            {post.category}
          </span>
          {post.publishedAt && (
            <span className="flex items-center gap-1 text-sm text-gray-400">
              <Calendar size={13} />
              {new Date(post.publishedAt).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-[hsl(214,60%,14%)] mb-4 leading-tight">{post.title}</h1>
        <p className="text-lg text-gray-600 mb-8 leading-relaxed border-l-4 border-[hsl(25,95%,53%)] pl-4">{post.excerpt}</p>

        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-bold text-[hsl(214,60%,14%)] mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-[hsl(25,95%,53%)]" />
              Related Articles
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group block border border-gray-200 rounded-xl p-4 hover:border-[hsl(25,95%,53%)] hover:shadow-sm transition-all"
                  data-testid={`related-post-${r.slug}`}
                >
                  {r.category && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[hsl(25,95%,40%)] mb-2">
                      <Tag size={11} />
                      {r.category}
                    </span>
                  )}
                  <h4 className="font-semibold text-[hsl(214,60%,14%)] leading-snug group-hover:text-[hsl(25,95%,45%)] transition-colors">
                    {r.title}
                  </h4>
                  {r.excerpt && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{r.excerpt}</p>}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(25,95%,53%)] mt-3">
                    Read more <ArrowRight size={12} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12 bg-[hsl(214,60%,14%)] text-white rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Got electrical questions?</h3>
          <p className="text-gray-300 mb-5">We're happy to chat through your project — no obligation.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="tel:0419868703"
              className="inline-flex items-center gap-2 bg-[hsl(25,95%,53%)] hover:bg-[hsl(25,95%,45%)] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              <Phone size={16} />
              Call 0419 868 703
            </a>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Book an Appointment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
