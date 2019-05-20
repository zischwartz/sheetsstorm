# Sheets Storm

> Sheets Storm is a web application built to turn Google Spreadsheets into JSON on AWS S3 with the click of a button. Functionally, it's a drop in replacement for [Driveshaft](https://github.com/newsdev/driveshaft), without a server.

- [Quickstart](#quickstart)
- [Bucket Config](#bucket-config)
- [Dev](#dev)
- [Notes](#notes)

## Quickstart

You can use [`Sheets Storm`](https://json.sheetsstorm.com/) with your own AWS credentials without installing anything.

You need your AWS credentials and an S3 bucket [configured](<(#bucket-config)>) as follows.

## Bucket Config

```

```

## Dev

Clone the repo, and run `yarn && yarn start` or `npm install && npm start` to get started.

## Notes

- Sheets Storm tries to emulate Driveshaft as much as possible, but there appeared to be cases where Driveshaft encodes some characters incorrectly, which is not replicated here. See this line here,
