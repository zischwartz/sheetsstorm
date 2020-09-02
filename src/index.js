// import "core-js/stable";
import "regenerator-runtime/runtime";
// import regeneratorRuntime from "regenerator-runtime";
// import React from "react";
// import ReactDOM from "react-dom";

import { Pane } from "evergreen-ui/esm/layers";
import { SideSheet } from "evergreen-ui/esm/side-sheet";
// prettier-ignore
import { Text, Link, Heading, Code, Pre, Strong} from "evergreen-ui/esm/typography";
import { Button } from "evergreen-ui/esm/Buttons";
import { TextInput, TextInputField } from "evergreen-ui/esm/text-input";
// prettier-ignore
import { Table, TableHead, TableHeaderCell, TextTableHeaderCell, SearchTableHeaderCell, TableBody, TableRow, TableCell, TextTableCell} from "evergreen-ui/esm/table";
import { Menu } from "evergreen-ui/esm/menu";
import { toaster } from "evergreen-ui/esm/toaster";

import { Spinner } from "evergreen-ui/esm/spinner";
import { StackingOrder, Intent, Position } from "evergreen-ui/esm/constants";
import { Badge, Pill } from "evergreen-ui/esm/badges";

import { Router, Route } from "react-enroute";
import { SocialIcon } from "react-social-icons";

// prettier-ignore
import { asyncForEach, get_cred_params,  set_cred_params,  has_all_cred,  setup_s3,  get_files,  put_file,  to_human_date} from "./util";
import SheetsFileAdd from "./sf_add";
import CredEdit from "./cred_edit";
import SingleFile from "./single_file";
import ExistingEntries from "./existing";
import { get_sheetsdoc } from "./get_sheetsdoc";

class App extends React.Component {
  constructor(props) {
    super(props);
    let cred = get_cred_params();
    this.putSheetsDataToS3 = this.putSheetsDataToS3.bind(this);
    this.credSubmit = this.credSubmit.bind(this);
    let show_cred = !has_all_cred(cred);
    this.state = { show_sf_add: false, show_cred, cred, selected: false };
    // e.g. / debug
    // this.state = { show_sf_add: false, show_cred, cred, selected: "prod/some_area/a_project.json" };
  }

  async load_files(cred) {
    if (has_all_cred(cred)) {
      const is_legacy_mode = await this.check_if_legacy();
      // special case
      if (is_legacy_mode) {
        // this.load_legacy_files();
        // and return
        return;
      }

      get_files(this.s3, "prod/")
        .then((file_list) => {
          this.setState({ file_list, show_cred: false });
        })
        .catch((e) => {
          toaster.danger(
            "There was a problem with your credentials or the bucket settings! Please make sure you've got them right",
            { duration: 30 }
          );
        });
    }
  }
  // this uses Loren's old driveshaft kludge spreadsheet - highly NA specific
  async check_if_legacy() {
    try {
      const legacy_index_file = await this.s3
        .getObject({ Key: `data/project_index/index.json` })
        .promise();
      let legacy_lookup = JSON.parse(legacy_index_file.Body.toString());
      legacy_lookup = legacy_lookup["Sheet1"];
      // XXX remove the first entry, the index file the actual object we're loading,
      legacy_lookup = legacy_lookup.slice(1);

      this.setState({ legacy_lookup, is_legacy_mode: true });
      return true;
    } catch (e) {
      this.setState({ is_legacy_mode: false });
      // console.log(e);
      return false;
    }
  }

  async componentDidMount() {
    // need to make a role ... maybe
    // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photos-view.html

    this.s3 = setup_s3(this.state.cred);
    this.load_files(this.state.cred);
  }
  async putSheetsDataToS3(info, sheets_doc) {
    // console.log("putSheetsDataToS3");
    // console.log(info, sheets_doc);
    this.setState({ show_sf_add: false });
    toaster.notify("Uploading To S3...", { duration: 120 });
    let now = new Date();
    now = `${now.valueOf()}`;
    // we'll use these later
    let meta = { name: info.name, from: now, sheets_key: info.sheets_key };
    let body = JSON.stringify(sheets_doc);
    const p_path_prefix = this.state.is_legacy_mode ? "data/" : "prod/";
    try {
      await put_file(this.s3, `${p_path_prefix}${info.path}.json`, body, meta);
      await put_file(this.s3, `archive/${info.path}_${now}.json`, body, {});
    } catch (e) {
      console.log(e);
      toaster.closeAll();
      // prettier-ignore
      toaster.warning( "Publishing to S3 Failed! Make sure your credentials are correct and you have adequate permissions.",  { duration: 15 } );
      return;
    }

    toaster.closeAll();
    toaster.success("Done with upload to S3!", { duration: 15 });
    // repull the list to update ui
    this.load_files(this.state.cred);
  }
  credSubmit(cred) {
    // console.log("cred submit", cred);
    this.setState({ cred });
    this.s3 = setup_s3(cred);
    this.load_files(cred);
    // update the url with settings if they're ok with it
    if (cred.update_url) {
      set_cred_params(cred);
    }
  }
  render() {
    let full_cred_flag = has_all_cred(this.state.cred);

    return (
      <Pane display="flex" minHeight="98vh" flexDirection="column">
        <Pane display="flex" flexDirection="column" flex={1}>
          <SideSheet
            position={Position.TOP}
            isShown={this.state.show_sf_add}
            onCloseComplete={() => this.setState({ show_sf_add: false })}
          >
            <SheetsFileAdd
              onComplete={this.putSheetsDataToS3}
              file_list={this.state.file_list}
            />
          </SideSheet>
          <SideSheet
            position={Position.BOTTOM}
            isShown={this.state.show_cred}
            onCloseComplete={() => this.setState({ show_cred: false })}
          >
            <CredEdit onSubmit={this.credSubmit} cred={this.state.cred} />
          </SideSheet>
          {!this.s3 ? (
            ``
          ) : (
            <SideSheet
              position={Position.LEFT}
              isShown={!!this.state.selected}
              onCloseComplete={() => this.setState({ selected: false })}
            >
              <SingleFile
                s3={this.s3}
                cred={this.state.cred}
                selected={this.state.selected}
                putSheetsDataToS3={this.putSheetsDataToS3}
                is_legacy_mode={this.state.is_legacy_mode}
                legacy_lookup={this.state.legacy_lookup}
              />
            </SideSheet>
          )}

          <Pane
            textAlign="center"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Code>⛈ Sheets Storm 📊</Code>
            {full_cred_flag ? (
              <Pane marginLeft={16}>
                {this.state.is_legacy_mode ? (
                  <Badge color="orange" marginX={4}>
                    LEGACY MODE
                  </Badge>
                ) : (
                  ``
                )}
                <Code>
                  <Badge color="yellow" marginRight={4}>
                    Bucket:
                  </Badge>
                  {this.state.cred.bucket}
                </Code>
              </Pane>
            ) : (
              ""
            )}
          </Pane>
          <Button
            appearance="primary"
            iconBefore="plus"
            height="44"
            marginTop={16}
            disabled={this.state.is_legacy_mode}
            onClick={() => this.setState({ show_sf_add: true })}
          >
            Add a new Google Sheets Document
          </Button>
          <Button
            marginTop={16}
            appearance={full_cred_flag ? "default" : "primary"}
            iconBefore="lock"
            height="44"
            onClick={() => this.setState({ show_cred: true })}
          >
            {full_cred_flag ? "Edit" : "Add"} AWS Credentials & Bucket
          </Button>
          <ExistingEntries
            file_list={this.state.file_list}
            is_legacy_mode={this.state.is_legacy_mode}
            legacy_lookup={this.state.legacy_lookup}
            onEditClick={async (path) => {
              this.setState({ selected: path });
            }}
          />
        </Pane>
        <Pane
          textAlign="center"
          marginTop={32}
          display="flex"
          justifyContent="center"
        >
          <Pane marginX={8}>
            <Text size={400}>
              Made By{" "}
              <Link size={400} href="https://zachschwartz.com">
                Zach Schwartz
              </Link>
              <SocialIcon
                url="https://github.com/zischwartz"
                style={soc_style}
              />
              <SocialIcon
                url="https://twitter.com/zischwartz"
                style={soc_style}
              />
            </Text>
          </Pane>
          <Pane>
            <Text size={400}>&</Text>
          </Pane>
          <Pane marginX={8}>
            <Text size={400}>
              <Link size={400} href="https://newamerica.org">
                New America
              </Link>
              <SocialIcon
                url="https://github.com/newamericafoundation"
                style={soc_style}
              />
              <SocialIcon
                url="https://twitter.com/NewAmerica"
                style={soc_style}
              />
            </Text>
          </Pane>
        </Pane>
      </Pane>
    );
  }
}

const soc_style = { height: 16, width: 16, marginLeft: 4, marginRight: 4 };

// *****************************************************************************
// XXX this is what actually starts it, as we can't do much until it's
// *****************************************************************************
gapi.load("client", () => {
  // console.log("l");
  var mountNode = document.getElementById("app");
  ReactDOM.render(<App />, mountNode);
});
