#!/usr/bin/env ruby
# frozen_string_literal: true

require "date"
require "yaml"

POST_GLOB = "_posts/**/*.md"
REQUIRED_FIELDS = %w[layout title description date categories tags].freeze

failures = []
descriptions = Hash.new { |hash, key| hash[key] = [] }
post_count = 0

Dir.glob(POST_GLOB).sort.each do |path|
  post_count += 1
  source = File.read(path)
  match = source.match(/\A---\s*\n(.*?)\n---\s*\n/m)

  unless match
    failures << "#{path}: YAML front matter가 없습니다."
    next
  end

  front_matter = match[1]
  data = YAML.safe_load(
    front_matter,
    permitted_classes: [Date, Time],
    aliases: true
  ) || {}

  REQUIRED_FIELDS.each do |field|
    value = data[field]
    empty = value.nil? || (value.respond_to?(:empty?) && value.empty?)
    failures << "#{path}: #{field} 값이 비어 있습니다." if empty
  end

  filename_date = File.basename(path)[0, 10]
  metadata_date = front_matter[/^date:\s*["']?(\d{4}-\d{2}-\d{2})/, 1]
  if metadata_date && filename_date != metadata_date
    failures << "#{path}: 파일 날짜 #{filename_date}와 date #{metadata_date}가 다릅니다."
  end

  description = data["description"].to_s.strip
  descriptions[description] << path unless description.empty?

  body = source[match.end(0)..]
  in_fence = false

  body.each_line.with_index(1) do |line, line_number|
    if line.match?(/^\s*(```|~~~)/)
      in_fence = !in_fence
      next
    end

    next if in_fence || !line.start_with?("# ")

    failures << "#{path}: 본문 #{line_number}행에 H1이 있습니다. 글 제목은 테마가 렌더링합니다."
  end
end

descriptions.each do |description, paths|
  next unless paths.length > 1

  failures << "중복 description: #{paths.join(', ')} (#{description})"
end

unless failures.empty?
  warn "Post validation failed:"
  failures.each { |failure| warn "- #{failure}" }
  exit 1
end

puts "Validated #{post_count} posts."
