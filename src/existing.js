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
// prettier-ignore
import { asyncForEach, get_cred_params,  set_cred_params,  has_all_cred,  setup_s3,  get_files,  put_file,  to_human_date} from "./util";

export default class ExistingEntries extends React.Component {
  render() {
    let { file_list, is_legacy_mode } = this.props;

    let list_entries = !file_list
      ? ``
      : file_list.map((entry) => (
          <NormalExisting entry={entry} onEditClick={this.props.onEditClick} />
        ));
    // deal with legacy mode !
    if (is_legacy_mode) {
      // console.log(this.props.legacy_lookup);

      list_entries = !this.props.legacy_lookup
        ? ``
        : this.props.legacy_lookup.map((entry) => (
            <LegacyExisting
              entry={entry}
              onEditClick={this.props.onEditClick}
            />
          ));
    }
    return (
      <Pane padding={16} border marginTop={16} elevation={0}>
        <Heading marginBottom={16}>Your Files</Heading>
        {!list_entries.length ? <Spinner marginX="auto" marginY={32} /> : ``}
        {list_entries && list_entries.length === 0 ? (
          <Text> No Files Yet. Add one above!</Text>
        ) : (
          ``
        )}
        {list_entries}
      </Pane>
    );
  }
}

function LegacyExisting(props) {
  let { entry, onEditClick } = props;

  let human_path = entry.publish1
    .replace("s3://na-data-projects/data/", "")
    .replace(".json", "");

  let main_path = entry.publish1.replace("s3://na-data-projects/", "");
  // console.log(main_path);
  return (
    <Pane
      key={entry.key}
      marginY={8}
      padding={8}
      background="tint1"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
    >
      <Heading size={500}>{entry.name}</Heading>
      <Text>{human_path}</Text>
      <Button
        iconBefore="edit"
        appearance="primary"
        intent="success"
        height={36}
        onClick={() => onEditClick(main_path)}
      >
        Edit/Update
      </Button>
    </Pane>
  );
}
function NormalExisting(props) {
  let { entry, onEditClick } = props;
  let human_path = entry.Key.split(".json")[0].replace("prod/", "");
  let modified = to_human_date(entry.LastModified);
  return (
    <Pane
      key={human_path}
      marginY={8}
      padding={8}
      background="tint1"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
    >
      <Text size={300}>{modified}</Text>

      <Heading size={500}>{human_path}</Heading>
      <Button
        iconBefore="edit"
        appearance="primary"
        intent="success"
        height={36}
        onClick={() => onEditClick(entry.Key)}
      >
        Edit/Update
      </Button>
    </Pane>
  );
}
