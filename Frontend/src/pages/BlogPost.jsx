import { Helmet } from "react-helmet-async";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Clock, Calendar, User, BookOpen } from "lucide-react";
import { getBlogPostBySlug, blogPosts } from "../data/blogPosts";
import Editable from "../components/editable/Editable";

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = getBlogPostBySlug(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Article not found.</p>
        <Link to="/blog" className="text-brand font-medium hover:underline">
          Back to Blog
        </Link>
      </div>
    );
  }

  const related = blogPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2);
  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <Helmet>
        <title>{post.title} | AstroMart Blog</title>
        <meta name="description" content={post.excerpt} />
      </Helmet>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 flex items-center gap-1 hover:text-brand w-fit"
      >
        <ArrowLeft size={15} /> Back
      </button>

      {/* Post Header */}
      <div>
        <Editable
          as="span"
          id="blogpost-category-badge"
          label="Blog Post Category Badge"
          kind="button"
          className="text-[11px] font-semibold uppercase tracking-wide text-brand bg-brand/10 px-2 py-0.5 rounded"
        >
          {post.category}
        </Editable>
        <Editable
          as="h1"
          id="blogpost-title"
          label="Blog Post Title"
          className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mt-2.5 leading-tight"
        >
          {post.title}
        </Editable>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-3">
          <Editable as="span" id="blogpost-author" label="Blog Post Author" className="flex items-center gap-1">
            <User size={12} /> {post.author}
          </Editable>
          <Editable as="span" id="blogpost-date" label="Blog Post Date" className="flex items-center gap-1">
            <Calendar size={12} /> {formattedDate}
          </Editable>
          <Editable as="span" id="blogpost-readtime" label="Blog Post Read Time" className="flex items-center gap-1">
            <Clock size={12} /> {post.readMins} min read
          </Editable>
        </div>
      </div>

      {/* Featured Image */}
      <div className="rounded-md overflow-hidden bg-gray-100 aspect-[16/9]">
        <img loading="lazy" src={post.image} alt={post.title} className="w-full h-full object-cover" />
      </div>

      {/* Article Body */}
      <Editable
        as="article"
        kind="button"
        id="blogpost-article-bg"
        label="Blog Article Card Background"
        className="bg-white rounded-md shadow-card p-5 sm:p-7 flex flex-col gap-4"
      >
        {post.content.map((para, i) => (
          <Editable
            key={i}
            as="p"
            group="blogpost-paragraph"
            label="Blog Post Paragraph"
            className="text-[14px] text-gray-700 leading-[1.8]"
          >
            {para}
          </Editable>
        ))}
      </Editable>

      {/* Related Posts */}
      {related.length > 0 && (
        <div>
          <Editable
            as="h2"
            id="blogpost-related-heading"
            label="Related Posts Heading"
            className="font-display font-semibold text-base text-gray-900 mb-3 flex items-center gap-2"
          >
            <BookOpen size={16} className="text-brand" /> More on {post.category}
          </Editable>
          <div className="grid sm:grid-cols-2 gap-4">
            {related.map((r) => (
              <Editable
                key={r.slug}
                as={Link}
                to={`/blog/${r.slug}`}
                kind="button"
                group="blogpost-related-card"
                label="Related Post Card Background"
                className="bg-white rounded-md shadow-card overflow-hidden flex gap-3 p-3 hover:shadow-lg transition-shadow"
              >
                <img loading="lazy"
                  src={r.image}
                  alt={r.title}
                  className="w-20 h-20 rounded object-cover shrink-0"
                />
                <div className="min-w-0">
                  <Editable
                    as="h3"
                    group="blogpost-related-title"
                    label="Related Post Title"
                    className="font-medium text-[13px] text-gray-900 leading-snug line-clamp-2"
                  >
                    {r.title}
                  </Editable>
                  <Editable
                    as="p"
                    group="blogpost-related-readtime"
                    label="Related Post Read Time"
                    className="text-[11px] text-gray-400 mt-1"
                  >
                    {r.readMins} min read
                  </Editable>
                </div>
              </Editable>
            ))}
          </div>
        </div>
      )}

      {/* CTA Banner */}
      <Editable
        as="div"
        kind="button"
        id="blogpost-cta-banner"
        label="Blog Post CTA Banner Background"
        className="bg-gradient-to-r from-brand to-brand-light rounded-md shadow-card p-5 text-center text-white"
      >
        <Editable
          as="p"
          id="blogpost-cta-heading"
          label="Blog Post CTA Heading"
          className="font-display font-semibold text-base mb-1"
        >
          Have a specific question?
        </Editable>
        <Editable
          as="p"
          id="blogpost-cta-subtext"
          label="Blog Post CTA Subtext"
          className="text-xs text-white/85 mb-3"
        >
          Talk to a verified astrologer for guidance tailored to your birth chart.
        </Editable>
        <Editable
          as={Link}
          to="/astrologers"
          kind="button"
          id="blogpost-cta-btn"
          label="Blog Post CTA Button"
          className="inline-block bg-white text-brand text-xs font-semibold px-5 py-2 rounded-sm hover:bg-gray-50 transition-colors"
        >
          Talk to an Astrologer
        </Editable>
      </Editable>
    </div>
  );
}
