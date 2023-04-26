# This article goes over everything in detail, use 10 threads to speed up process
# instead of reading from csv read from jsonlines (can probs just read file line by line and parse with native json reader)
# https://support.cloudinary.com/hc/en-us/articles/202520662-How-can-I-bulk-upload-my-images-
#
# I have 10GB of storage space, up to 300,000 images
# I'll probably only have around 25,000 images ish so more than enough space
# One potential issue is the 10mb per image size limit, I should edit this ruby script to handle that
#
# Current plan:
# Free Classic Plan FREE
# 20,000 Monthly Transformations
# 300,000 Total Images & Videos
# 10 GB Managed Storage
# 20 GB Monthly Viewing Bandwidth
#
# I tested it out and from my testing it seems like the avg img is 0.3 mb, so I can
# store about 30,000 images in 10GB I think?

require 'cloudinary'
require 'json'

# I'm getting the config info from a json file
Cloudinary.config do |config|
    config.cloud_name = '********'
    config.api_key = '*************'
    config.api_secret = '**********'
end

puts 'My cloud name is:' + Cloudinary.config.cloud_name

files_to_upload = []
descriptions_to_upload = {}

puts files_to_upload.size.to_s + ' resources total'
puts files_to_upload if files_to_upload.size < 100
puts 'Start time: ' + Time.new.inspect
sleep 5; # Delays info output by 5 seconds

# Divide into a number of threads to speed up bulk upload process, maximum of 10 threads
transferred_resources = []
threads = []
number_of_threads = 2 # My Macbook only has 2 cores

chunk_size = files_to_upload.size / number_of_threads
chunks = files_to_upload.each_slice(chunk_size).to_a; 0

puts chunk_size
puts chunks.size
puts chunks[0]

chunks.each do |res| # res is a chunk of three or however way the assets were divided
  threads << Thread.new do
    res.each_with_index do |resource, i|
      # Decide how to name the new file - in this example, last part of the file path, excluding extension
      new_public_id = resource.split('/')[-1].sub(/\.[^.]+\z/, '')

      puts new_public_id

      puts "#{i}/#{res.length} #{resource} - " + Time.new.inspect

      result = Cloudinary::Uploader.upload(
        resource,
        public_id: new_public_id,
        folder: 'bulkupload',
        type: 'upload',
        overwrite: false,
        context: { alt: descriptions_to_upload[resource] },
        tags: ['migrated'],
        return_error: true
      ); 0

      puts "#{i}/#{res.length} #{resource} - " + Time.new.inspect
      transferred_resources.push(result); 0
    end
  end
end; 0
threads.each { |thr| thr.join } # This returns your threads back

# Displays any error messages
transferred_resources.select { |a| a['error'] }
puts 'End time: ' + Time.new.inspect
