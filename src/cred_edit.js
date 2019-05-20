import { Pane } from "evergreen-ui/esm/layers";
import { SideSheet } from "evergreen-ui/esm/side-sheet";
// prettier-ignore
import { Paragraph, Text, Code, Heading, Link } from "evergreen-ui/esm/typography";
import { Button } from "evergreen-ui/esm/Buttons";
import { TextInput, TextInputField } from "evergreen-ui/esm/text-input";
// prettier-ignore
import { Menu } from "evergreen-ui/esm/menu";
import { toaster } from "evergreen-ui/esm/toaster";
import { Checkbox } from "evergreen-ui/esm/checkbox";

import { get_sheetsdoc } from "./get_sheetsdoc";

export default class CredEdit extends React.Component {
  constructor(props) {
    super(props);
    let { bucket, key_id, secret_access_key, region } = props.cred;
    region = region.length ? region : "us-west-2";
    let update_url = true;
    this.state = { bucket, key_id, secret_access_key, region, update_url };
  }

  render() {
    let on_enter = e => {
      if (e.which === 13) {
        return this.props.onSubmit(this.state);
      }
      return true;
    };
    return (
      <Pane
        display="flex"
        flexDirection="column"
        border
        padding={16}
        margin={8}
      >
        {/*<Pane fontFamily="Patua One" fontSize={60} textAlign="center">*/}
        <Pane marginTop={8} textAlign="center">
          <Code fontSize={28}>⛈ Sheets Storm 📊</Code>
        </Pane>
        <Pane padding={10} marginY={8}>
          <Paragraph marginY={4} marginX="auto">
            Sheets Storm is a web application built to turn Google Drive
            (Spread) Sheets into JSON deployed on AWS S3 with the click of a
            button (and revert back to previous versions if someone makes a
            mistake!)
          </Paragraph>
          <Paragraph marginY={4} marginX="auto" />

          <Paragraph marginY={4} marginX="auto">
            Enter your information below, or visit the{" "}
            <Link href="https://github.com/zischwartz/sheetsstorm">
              documentation & source repo
            </Link>
            .
          </Paragraph>
        </Pane>
        <Heading size={500} marginBottom={8} textAlign="center">
          {this.props.cred.key_id ? "Edit" : "Add"} Config/Credentials
        </Heading>
        <TextInputField
          placeholder="Your Access Key ID"
          label="AWS Access Key ID"
          onKeyPress={on_enter}
          onChange={e => this.setState({ key_id: e.target.value })}
          value={this.state.key_id}
        />
        <TextInputField
          placeholder="Your Secret Key"
          label="AWS Secret Access Key"
          onKeyPress={on_enter}
          onChange={e => this.setState({ secret_access_key: e.target.value })}
          value={this.state.secret_access_key}
          autocomplete="new-password"
        />
        <TextInputField
          placeholder="Some general bucket"
          label="S3 Bucket"
          onKeyPress={on_enter}
          onChange={e => this.setState({ bucket: e.target.value })}
          value={this.state.bucket}
        />
        <TextInputField
          placeholder="us-west-2"
          label="AWS Region"
          onKeyPress={on_enter}
          onChange={e => this.setState({ region: e.target.value })}
          value={this.state.region}
        />
        <Checkbox
          label="Update Page URL With These Settings (Turn this off if using a public computer)"
          checked={this.state.update_url}
          onChange={e => this.setState({ update_url: e.target.checked })}
        />
        <Heading size={300} textAlign="center">
          We don't store or transmit any of your data (except to AWS). We don't
          even have a server.
        </Heading>

        <Button
          appearance="primary"
          iconBefore="lock"
          height="44"
          onClick={() => this.props.onSubmit(this.state)}
        >
          Set Credentials
        </Button>
      </Pane>
    );
  }
}
