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
  let h_string = location.hash.slice(1);
  let data = h_string ? JSON.parse(atob(decodeURIComponent(h_string))) : {};
  let cred = data["cred"] || {};
  // console.log(data);
  return {
    bucket: cred["bucket"] || "",
    key_id: cred["key_id"] || "",
    secret_access_key: cred["secret_access_key"] || "",
    region: cred["region"] || "us-west-2"
  };
}

export function set_cred_params(cred) {
  let data_string = encodeURIComponent(btoa(JSON.stringify({ cred })));
  history.replaceState(null, null, "#" + data_string);
}

export function has_all_cred(cred) {
  return (
    cred["bucket"].length &&
    cred["key_id"].length &&
    cred["secret_access_key"].length
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
  // let sts = new AWS.STS();
  // sts.getCallerIdentity().promise().then(console.log);
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
