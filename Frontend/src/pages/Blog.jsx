import { Helmet } from "react-helmet-async";
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Clock, ArrowRight, BookOpen } from "lucide-react";
import { blogPosts, blogCategories } from "../data/blogPosts";
import Editable from "../components/editable/Editable";

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(() => {
    if (activeCategory === "All") return blogPosts;
    return blogPosts.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="flex flex-col gap-5">
      <Helmet>
        <title>Blog | AstroMart</title>
        <meta name="description" content="Read practical guides on gemstones, rudraksha, vastu, kundli matching and festival rituals." />
      </Helmet>
      {/* Hero Banner */}
      <Editable
        as="div"
        kind="button"
        id="blog-hero-banner"
        label="Blog Hero Banner Background"
        className="bg-gradient-to-r from-brand to-brand-light rounded-md shadow-card p-6 sm:p-8 text-white text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-constellation opacity-50" />
        <div className="relative">
          <BookOpen size={30} className="mx-auto mb-2 text-gold-light" />
          <Editable
            as="h1"
            id="blog-hero-heading"
            label="Blog Page Heading"
            className="font-display font-bold text-2xl sm:text-3xl mb-1.5"
          >
            Astro Wala Shop Blog
          </Editable>
          <Editable
            as="p"
            id="blog-hero-subtext"
            label="Blog Page Subtext"
            className="text-sm text-white/85 max-w-lg mx-auto"
          >
            Practical guides on gemstones, rudraksha, vastu, kundli matching and festival
            rituals — written to help you make informed choices.
          </Editable>
        </div>
      </Editable>

      {/* Category filter */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {["All", ...blogCategories].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap text-xs font-medium px-3.5 py-1.5 rounded-full border transition-colors ${
              activeCategory === cat
                ? "bg-brand text-white border-brand"
                : "bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Blog Cards Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((post) => (
          <Editable
            key={post.slug}
            as={Link}
            to={`/blog/${post.slug}`}
            kind="button"
            group="blog-card-bg"
            label="Blog Card Background"
            className="bg-white rounded-md shadow-card overflow-hidden flex flex-col hover:shadow-lg transition-shadow group"
          >
            <div className="aspect-[16/10] overflow-hidden bg-gray-100">
              <img loading="lazy"
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="p-4 flex flex-col gap-2 flex-1">
              <Editable
                as="span"
                group="blog-card-category"
                label="Blog Card Category Badge"
                className="text-[10px] font-semibold uppercase tracking-wide text-brand bg-brand/10 self-start px-2 py-0.5 rounded"
              >
                {post.category}
              </Editable>
              <Editable
                as="h2"
                group="blog-card-title"
                label="Blog Card Title"
                className="font-display font-semibold text-[15px] text-gray-900 leading-snug"
              >
                {post.title}
              </Editable>
              <Editable
                as="p"
                group="blog-card-excerpt"
                label="Blog Card Excerpt"
                className="text-xs text-gray-500 leading-relaxed line-clamp-2 flex-1"
              >
                {post.excerpt}
              </Editable>
              <div className="flex items-center justify-between pt-1.5 mt-auto border-t border-gray-100 text-[11px] text-gray-400">
                <Editable
                  as="span"
                  group="blog-card-readtime"
                  label="Blog Card Read Time"
                  className="flex items-center gap-1"
                >
                  <Clock size={11} /> {post.readMins} min read
                </Editable>
                <Editable
                  as="span"
                  group="blog-card-read-link"
                  label="Blog Card Read Link"
                  className="text-brand font-medium flex items-center gap-0.5 group-hover:gap-1.5 transition-all"
                >
                  Read <ArrowRight size={12} />
                </Editable>
              </div>
            </div>
          </Editable>
        ))}
      </div>
    </div>
  );
}
