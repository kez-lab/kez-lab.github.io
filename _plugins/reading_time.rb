module ReadingTimeFilter
  def reading_time(input)
    # Define words per minute
    words_per_minute = 200
    
    # Count words
    words = input.split.size
    
    # Calculate reading time
    minutes = (words / words_per_minute).floor
    seconds = ((words % words_per_minute) / (words_per_minute / 60)).floor
    
    # Format the output
    if minutes >= 1
      "#{minutes} min read"
    else
      "less than 1 min read"
    end
  end
end

Liquid::Template.register_filter(ReadingTimeFilter)
