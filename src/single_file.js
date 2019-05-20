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

    let path = this.props.selected.split(".json")[0].replace("prod/", "");
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
    await put_file(
      this.props.s3,
      this.props.selected,
      archive_file.Body.toString(),
      meta
    );
    await this.loadFileAndArchives();
    toaster.closeAll();
    toaster.success(`Successfully Reverted`);
  }
  async componentDidMount() {
    await this.loadFileAndArchives();
  }
  async loadFileAndArchives() {
    let prod_file = await this.props.s3
      .getObject({ Key: this.props.selected })
      .promise();

    let meta = prod_file.Metadata;
    // console.log(prod_file);
    let search_path = this.props.selected
      .replace(".json", "")
      .replace("prod/", "archive/");
    let archive = await this.props.s3
      .listObjects({ Delimiter: "", Prefix: search_path })
      .promise()
      .catch(e => console.log("err", e));
    archive = archive.Contents;
    let file_data_obj = JSON.parse(prod_file.Body.toString());
    let overview = Object.keys(file_data_obj).map(table_name => {
      let rows = file_data_obj[table_name].length;
      return { table_name, rows };
    });

    this.setState({ meta, archive, overview });
    // console.log(archive);

    // meta['']
    // console.log(prod_file.Metadata);
    // console.log(prod_file);
  }
  render() {
    let { bucket, region } = this.props.cred;
    let full_path = `https://${bucket}.s3.${region}.amazonaws.com/${
      this.props.selected
    }`;
    return (
      <Pane padding={8} margin={8}>
        <Heading size={700} marginY={16}>
          {this.state.meta ? this.state.meta.name : <Spinner />}
        </Heading>
        <Heading marginY={16}>
          <Link href={full_path} target="_blank">
            {this.props.selected.slice(5).slice(0, -5)}
          </Link>
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

        {!this.state.archive ? (
          <Spinner />
        ) : (
          this.state.archive.map((obj, i) => {
            let is_active = obj.Key.endsWith(`_${this.state.meta.from}.json`);
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
          })
        )}
        <Pane margin={16} padding={16} background="tint1">
          <Heading marginBottom={16}>Overview of Active File</Heading>

          {this.state.overview.map(({ table_name, rows }) => {
            return (
              <Pane
                key={table_name}
                display="flex"
                justifyContent="space-between"
                borderBottom
                marginBottom={2}
              >
                <Code>{table_name}</Code>
                <Text>{rows} rows</Text>
              </Pane>
            );
          })}
        </Pane>
      </Pane>
    );
  }
}
