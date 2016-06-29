[![Stories in Ready](https://badge.waffle.io/solid-live/extractors.png?label=ready&title=Ready)](https://waffle.io/solid-live/extractors)

# extractors
linked data and media extractor library

# installation

    sudo npm install -g extractors

# example

    get https://github.com/timbl

    <#this> <http://purl.org/dc/dcam/memberOf> "MIT" .
    <#this> <http://purl.org/dc/terms/created> "Dec 11, 2011" .
    <#this> <http://schema.org/address> "Boston MA USA" .
    <#this> <http://www.w3.org/2000/01/rdf-schema#seeAlso> <http://www.w3.org/People/Berners-Lee> .
    <#this> <http://xmlns.com/foaf/0.1/mbox> <mailto:timbl@w3.org> .


# your own extractors

for a given domain www.somesite.com add a file in your extractors directory and it will get used
