# Sheets Storm

> [Sheets Storm](https://json.sheetsstorm.com/) is a web application built to turn Google Drive (Spread) Sheets into JSON files deployed on AWS S3 with the click of a button (and revert back to previous versions if someone makes a mistake!) Functionally, it's a drop in replacement for [Driveshaft](https://github.com/newsdev/driveshaft), though without server-side code.

- [Quickstart](#quickstart)
- [Bucket Config](#bucket-config)
- [Dev](#dev)
- [Notes](#notes)

## Quickstart

You can use [`Sheets Storm`](https://json.sheetsstorm.com/) with your own AWS credentials without installing anything.

You need your AWS credentials and an S3 bucket [configured](<(#bucket-config)>) as follows.

## Bucket Config

`"Static website Hosting"` should be turned on.

Under **Permissions**,

**Block Public Access** should be turned off

**Access Control List** should allow your aws account to read and write objects

**Bucket Policy** should be be set to something like

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicListGet",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:List*", "s3:Get*"],
      "Resource": [
        "arn:aws:s3:::na-data-sheetsstorm",
        "arn:aws:s3:::na-data-sheetsstorm/*"
      ]
    }
  ]
}
```

**CORS Configuration** should be set to something like

```xml
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

## Dev

Clone the repo, and run `yarn && yarn start` or `npm install && npm start` to get started.

## Notes

- Sheets Storm tries to emulate Driveshaft as much as possible, but there appeared to be cases where Driveshaft encodes some characters incorrectly (mostly punctuation), which is not replicated here. For more information [see this area of the code](https://github.com/zischwartz/sheetsstorm/blob/master/src/get_sheetsdoc.js#L48-L103).
