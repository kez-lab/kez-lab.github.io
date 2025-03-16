
# This file will help us identify which file has the problematic include tag
# Run this with: ruby minimal_test.rb

require 'fileutils'

# Create a backup of the current post.html layout
if File.exist?('_layouts/post.html')
  FileUtils.cp '_layouts/post.html', '_layouts/post.html.bak'
end

# Create a very minimal post layout file
File.write('_layouts/post.html', <<-EOF
---
layout: default
---

<article class="post">
  <h1>{{ page.title }}</h1>
  <p class="meta">{{ page.date | date: "%B %d, %Y" }}</p>
  <div class="content">
    {{ content }}
  </div>
</article>
EOF
)

puts "Created a minimal post.html file. Now try running 'bundle exec jekyll serve' again."
puts "If it works, the problem was in the post.html layout file."
puts "The original file has been backed up as _layouts/post.html.bak"
