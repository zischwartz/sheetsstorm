// import regeneratorRuntime from "regenerator-runtime";

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
    secret_access_key: urlParams.get("secret_access_key") || ""
  };
}

export function set_cred_params(cred) {
  let urlParams = new URLSearchParams(window.location.search);
  urlParams.set("bucket", cred.bucket);
  urlParams.set("key_id", cred.key_id);
  urlParams.set("secret_access_key", cred.secret_access_key);
  window.location.search = urlParams.toString();
}

export function has_all_cred(cred) {
  return (
    cred["bucket"].length &&
    cred["key_id"].length &&
    cred["secret_access_key"].length
  );
}
