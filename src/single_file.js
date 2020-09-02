import copy from "clipboard-copy";
import { Pane } from "evergreen-ui/esm/layers";
// prettier-ignore
import { Text, Link, Heading, Code, Pre, Strong} from "evergreen-ui/esm/typography";
import { Button } from "evergreen-ui/esm/Buttons";
import { TextInput, TextInputField } from "evergreen-ui/esm/text-input";
// prettier-ignore
import { Menu } from "evergreen-ui/esm/menu";
import { toaster } from "evergreen-ui/esm/toaster";

import { Spinner } from "evergreen-ui/esm/spinner";
import { StackingOrder, Intent, Position } from "evergreen-ui/esm/constants";
import { Badge, Pill } from "evergreen-ui/esm/badges";

// prettier-ignore
import { asyncForEach, get_cred_params,  set_cred_params,  has_all_cred,  setup_s3,  get_files,  put_file,  to_human_date} from "./util";

import { get_sheetsdoc } from "./get_sheetsdoc";

export default class SingleFile extends React.Component {
  constructor(props) {
    super(props);
    this.revertTo = this.revertTo.bind(this);
    this.state = { meta: false, archive: false, overview: [] };
  }
  async addUpdate() {
    // console.log(this.state);
    // console.log(this.state.meta.sheets_key);
    let { meta } = this.state;
    let { sheets_key } = meta;
    toaster.notify("Fetching the Google Sheets Document...", { duration: 120 });
    let sheets_doc = await get_sheetsdoc(sheets_key);
    if (!sheets_doc) {
      toaster.closeAll();
      // prettier-ignore
      toaster.warning("There was a problem getting the file from Google Sheets. Make sure it's set to public.");
      return;
    }
    toaster.closeAll();
    toaster.success(`Successfully Loaded Latest Sheets Data`);

    let path = this.props.selected
      .split(".json")[0]
      .replace(this.get_path_prefix(), "");
    let info = { name: meta.name, sheets_key, path };
    await this.props.putSheetsDataToS3(info, sheets_doc);
    await this.loadFileAndArchives();
  }
  async revertTo(path_of_archive) {
    toaster.notify("Reverting", { duration: 120 });

    let ts = /(\d+).json/g.exec(path_of_archive)[1];
    let { sheets_key, name } = this.state.meta;
    let archive_file = await this.props.s3
      .getObject({ Key: path_of_archive })
      .promise();
    let meta = { name, from: ts, sheets_key };
    try {
      await put_file(
        this.props.s3,
        this.props.selected,
        archive_file.Body.toString(),
        meta
      );
    } catch (e) {
      toaster.closeAll();
      // prettier-ignore
      toaster.warning( "Publishing to S3 Failed! Make sure your credentials are correct and you have adequate permissions.",  { duration: 15 } );
      return false;
    }

    await this.loadFileAndArchives();
    toaster.closeAll();
    toaster.success(`Successfully Reverted`);
  }
  async componentDidMount() {
    try {
      await this.loadFileAndArchives();
    } catch (e) {
      this.setState({ error: true });
      toaster.warning("This file does not exist in the bucket");
      // console.log(e);
    }
  }
  get_path_prefix() {
    return this.props.is_legacy_mode ? "data/" : "prod/";
  }
  async loadFileAndArchives() {
    // console.log("loadFileAndArchives");
    // if we're in normal mode, we'll replace "/prod", in legacy mode, things start with "/data"
    const path_prefix_to_replace = this.get_path_prefix();

    let prod_file = await this.props.s3
      .getObject({ Key: this.props.selected })
      .promise();

    let meta = prod_file.Metadata;
    // console.log(prod_file);

    // the archive part is iffy for legacy mode XXX maybe just hide
    let search_path = this.props.selected
      .replace(".json", "")
      .replace(path_prefix_to_replace, "archive/");

    let archive = await this.props.s3
      .listObjects({ Delimiter: "", Prefix: search_path })
      .promise()
      .catch((e) => console.log("err", e));
    archive = archive.Contents;
    archive = archive.sort((a, b) => +b.LastModified - +a.LastModified);
    // console.log(archive);
    let file_data_obj = JSON.parse(prod_file.Body.toString());
    let overview = Object.keys(file_data_obj).map((table_name) => {
      let rows = file_data_obj[table_name].length;
      let cols = file_data_obj[table_name][0]
        ? Object.keys(file_data_obj[table_name][0])
        : [];
      return { table_name, rows, cols };
    });

    // console.log(meta);
    // console.log("!!!");
    // XXX special case if we're in legacy mode, the file won't have the meta data
    if (this.props.is_legacy_mode) {
      const record = this.props.legacy_lookup.find((x) => {
        return (
          this.props.selected ===
          x["publish1"].replace("s3://na-data-projects/", "")
        );
      });
      console.log("using", record);
      meta["name"] = record["name"];

      meta["sheets_key"] = record["key"];
    }

    this.setState({ meta, archive, overview });
    // console.log(archive);

    // meta['']
    // console.log(prod_file.Metadata);
    // console.log(prod_file);
  }
  render() {
    let { bucket, region } = this.props.cred;
    let full_path = `https://${bucket}.s3.${region}.amazonaws.com/${this.props.selected}`;
    let d = new Date(parseInt(this.state.meta.from));
    let active_date = this.state.meta.from ? to_human_date(d) : "";
    let { sheets_key } = this.state.meta;
    let name_for_display = this.state.meta ? this.state.meta.name : "...";
    return (
      <Pane>
        <Pane padding={8} margin={8}>
          <Heading size={700} marginY={16}>
            {this.state.error ? "Error: File not found" : name_for_display}
          </Heading>
          <Heading marginY={16} display="flex" justifyContent="space-between">
            <Link
              href={`https://docs.google.com/spreadsheets/d/${sheets_key}`}
              target="_blank"
            >
              Google Sheets Document Link
            </Link>
            <Link marginLeft={8} size={300} href={full_path} target="_blank">
              <Code>{this.props.selected.slice(5)}</Code>
            </Link>{" "}
          </Heading>
          <Pane
            display="flex"
            marginBottom={16}
            width="100%"
            flexDirection="row"
            alignItems="stretch"
          >
            <TextInput
              value={full_path}
              readOnly
              disabled
              color="rgb(20,20,20)"
              flex="1"
              cursor="text !important"
            />
            <Button
              iconBefore="duplicate"
              onClick={() => {
                copy(full_path);
                toaster.success("Copied URL");
              }}
            >
              Copy URL
            </Button>
          </Pane>
          <Button
            appearance="primary"
            width={"100%"}
            height={40}
            iconBefore="cloud-upload"
            marginBottom={32}
            onClick={() => this.addUpdate()}
          >
            Get Google Sheets Data and Upload New Version to S3
          </Button>
          <Heading marginY={16}>Archives</Heading>
          {this.state.archive && this.state.archive.length === 0 ? (
            <Text>No existing archives for this file</Text>
          ) : (
            ``
          )}
          {!this.state.archive && !this.state.error ? <Spinner /> : ``}
          {!this.state.archive
            ? ``
            : this.state.archive.map((obj, i) => {
                let is_active = obj.Key.endsWith(
                  `_${this.state.meta.from}.json`
                );
                return (
                  <Pane
                    key={i}
                    background="tint2"
                    marginY={8}
                    padding={8}
                    display="flex"
                    justifyContent="space-between"
                  >
                    <Text>
                      {" "}
                      {is_active ? "✅" : "⏹"} {to_human_date(obj.LastModified)}
                    </Text>
                    {!is_active ? (
                      <Button
                        iconBefore="undo"
                        onClick={() => this.revertTo(obj.Key)}
                      >
                        Revert To This Version
                      </Button>
                    ) : (
                      <Badge color="green">Active</Badge>
                    )}
                  </Pane>
                );
              })}
        </Pane>
        <Pane marginY={16} borderTop padding={16} background="tint1">
          <Pane display="flex" justifyContent="space-between">
            <Heading marginBottom={16} size={500}>
              Overview of Active File
            </Heading>
            <Heading marginBottom={16} size={400}>
              {active_date}
            </Heading>
          </Pane>
          {this.state.overview.map(({ table_name, rows, cols }) => {
            return (
              <Pane
                key={table_name}
                display="flex"
                justifyContent="space-between"
                borderBottom
                marginBottom={2}
              >
                <Code>{table_name}</Code>
                <Text>
                  {rows} rows x {cols.length} cols
                </Text>
              </Pane>
            );
          })}
        </Pane>
      </Pane>
    );
  }
}
