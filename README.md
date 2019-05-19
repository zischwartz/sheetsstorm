# Sheets Storm

### S3 Bucket Config - CORS, Bucket Policy

https://github.com/awslabs/aws-js-s3-explorer

```
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
<CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>DELETE</AllowedMethod>
    <ExposeHeader>ETag</ExposeHeader>
    <ExposeHeader>x-amz-meta-custom-header</ExposeHeader>
    <ExposeHeader>x-amz-meta-from</ExposeHeader>
    <ExposeHeader>x-amz-meta-name</ExposeHeader>
    <ExposeHeader>x-amz-meta-sheets_key</ExposeHeader>
    <AllowedHeader>*</AllowedHeader>
</CORSRule>
</CORSConfiguration>




```
