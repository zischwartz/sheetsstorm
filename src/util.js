// import regeneratorRuntime from "regenerator-runtime";

export function to_human_date(date) {
  return `${date.toDateString()} at ${date.toLocaleTimeString()}`;
}

export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export function get_cred_params() {
  let urlParams = new URLSearchParams(window.location.search);
  return {
    bucket: urlParams.get("bucket") || "",
    key_id: urlParams.get("key_id") || "",
    secret_access_key: urlParams.get("secret_access_key") || "",
    region: urlParams.get("region") || ""
  };
}

export function set_cred_params(cred) {
  let urlParams = new URLSearchParams(window.location.search);
  urlParams.set("bucket", cred.bucket);
  urlParams.set("key_id", cred.key_id);
  urlParams.set("secret_access_key", cred.secret_access_key);
  urlParams.set("region", cred.region);
  window.location.search = urlParams.toString();
}

export function has_all_cred(cred) {
  return (
    cred["bucket"].length &&
    cred["key_id"].length &&
    cred["secret_access_key"].length
    // cred["region"].length
  );
}

// AWS S3 helpers

export function setup_s3(cred) {
  AWS.config.credentials = {
    accessKeyId: cred.key_id,
    secretAccessKey: cred.secret_access_key
  };
  let region = cred.region || "us-west-2";
  AWS.config.update({ region });
  let s3 = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: cred.bucket }
  });
  return s3;
}

export async function get_files(s3, Prefix = "") {
  // s3.listObjects({ Delimiter: "/" })
  let res = await s3.listObjects({ Delimiter: "", Prefix }).promise();
  return res ? res["Contents"] : [];
}

export function put_file(s3, Key, Body, Metadata) {
  let params = {
    Key,
    Body,
    Metadata,
    ContentType: "application/json"
  };
  return s3.putObject(params).promise();
}
