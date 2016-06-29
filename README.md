[![Stories in Ready](https://badge.waffle.io/solid-live/extractors.png?label=ready&title=Ready)](https://waffle.io/solid-live/extractors)

# extractors
linked data and media extractor library

# installation

    sudo npm install -g extractors

# example

    get https://github.com/csarven

    <#this> <http://purl.org/dc/terms/title> "csarven (Sarven Capadisli) · GitHub" .

# your own extractors

for a given domain www.foo.com add a file in your extractors directory and it will get used
