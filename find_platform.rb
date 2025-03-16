
# This script will search for 'platform=' in all your files
# Run with: ruby find_platform.rb

def search_directory(dir)
  Dir.foreach(dir) do |entry|
    next if entry == '.' || entry == '..' || entry == '.git'
    
    path = File.join(dir, entry)
    
    if File.directory?(path)
      search_directory(path)
    else
      begin
        if File.extname(entry) =~ /\.(html|md|xml|markdown|liquid)$/i
          content = File.read(path)
          if content.include?('platform=platform[0]')
            puts "Found problematic syntax in: #{path}"
            line_number = content.split("\n").find_index { |line| line.include?('platform=platform[0]') }
            puts "  - Line #{line_number + 1}" if line_number
          end
        end
      rescue => e
        puts "Error reading #{path}: #{e.message}"
      end
    end
  end
end

puts "Searching for problematic include syntax..."
search_directory('.')
puts "Search complete."
