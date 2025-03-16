module ReadingTimeFilter
  def reading_time(input)
    # Strip HTML tags and normalize whitespace
    words = input.to_s.gsub(/<\/?[^>]*>/, "").gsub(/\s+/, " ").split(" ").count

    # Average reading speed: 180-200 words per minute
    minutes = (words / 180.0).ceil
    
    if minutes == 1
      "1 min read"
    else
      "#{minutes} min read"
    end
  end
end

Liquid::Template.register_filter(ReadingTimeFilter)
