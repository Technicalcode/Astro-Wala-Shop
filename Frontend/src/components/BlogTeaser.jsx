import { Link } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import { blogPosts } from "../data/blogPosts";
import Editable from "./editable/Editable";

export default function BlogTeaser() {
  const latest = blogPosts.slice(0, 3);

  return (
    <Editable
      as="div"
      kind="button"
      id="blog-frame"
      label="Blog Section Frame"
      className="bg-white rounded-md shadow-card p-4 md:p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <Editable
            as="h3"
            id="blog-frame-title"
            label="Blog Section Title"
            className="font-display font-semibold text-lg text-gray-900"
          >
            From the Astro Wala Shop Blog
          </Editable>
          <Editable as="p" id="blog-frame-paragraph" label="Blog Section Paragraph" className="text-xs text-gray-500">
            Guides on gemstones, vastu, kundli & more
          </Editable>
        </div>
        <Editable
          as={Link}
          to="/blog"
          id="blog-frame-viewall"
          label="View All Link"
          className="text-brand text-sm font-medium flex items-center gap-0.5 hover:underline shrink-0"
        >
          View All <ChevronRight size={15} />
        </Editable>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {latest.map((post) => (
          <Link
            key={post.slug}
            to={`/blog/${post.slug}`}
            className="flex flex-col gap-2 group"
          >
            <div className="aspect-[16/10] rounded-md overflow-hidden bg-gray-100">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <Editable
              as="h4"
              group="blog-card-title"
              label="Blog Card Title"
              className="font-medium text-[13px] text-gray-900 leading-snug line-clamp-2 group-hover:text-brand transition-colors"
            >
              {post.title}
            </Editable>
            <Editable
              as="span"
              group="blog-card-time"
              label="Blog Card Time"
              className="text-[11px] text-gray-400 flex items-center gap-1"
            >
              <Clock size={11} /> {post.readMins} min read
            </Editable>
          </Link>
        ))}
      </div>
    </Editable>
  );
}
