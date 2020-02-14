import React from "react";
import PropTypes from "prop-types";
import { View, TextInput, FlatList, Animated } from "react-native";

import Tag from "./Tag";
import styles from "./styles";

class Tags extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tags: props.initialTags,
      text: props.initialText,
      displayDeleteButton: false,
      suggestionRowHeight: new Animated.Value(0),
    };
  }

  componentWillReceiveProps(props) {
    const { initialTags = [] } = props;

    this.setState({
      tags: initialTags,
    });
  }

  addTag = text => {
    const regex = new RegExp(`[${this.props.removeSpecialChar.join("")}]`, "g");
    const tag = text.trim().replace(regex, "");
    if (tag.length > 0) {
      this.setState(
        {
          tags: [...this.state.tags, tag],
          text: "",
        },
        () =>
          this.props.onChangeTags && this.props.onChangeTags(this.state.tags)
      );
    }

    this.stopTracking();
  };

  onChangeText = text => {
    if (text.length === 0) {
      this.setState({ text });
      this.stopTracking();
    } else if (
      text.length > 1 &&
      this.props.createTagOnString.includes(text.slice(-1)) &&
      !(this.state.tags.indexOf(text.slice(0, -1).trim()) > -1)
    ) {
      this.addTag(text.slice(0, -1));
    } else {
      this.setState({ text });

      if (text.length >= this.props.startSearchAt) {
        this.startTracking();
        this.updateSuggestions(text);
      } else {
        this.stopTracking();
      }
    }
  };

  onSubmitEditing = () => {
    if (!this.props.createTagOnReturn) {
      return;
    }
    this.addTag(this.state.text);
  };

  closeSuggestionsPanel = () => {
    Animated.timing(this.state.suggestionRowHeight, {
      toValue: 0,
      duration: 100,
    }).start();
  };

  openSuggestionsPanel = height => {
    Animated.timing(this.state.suggestionRowHeight, {
      toValue: height ? height : this.props.suggestionPanelHeight,
      duration: 100,
    }).start();
  };

  startTracking = () => {
    this.isTrackingStarted = true;
    this.openSuggestionsPanel();
    this.setState({
      isTrackingStarted: true,
    });
  };

  stopTracking = () => {
    this.isTrackingStarted = false;
    this.closeSuggestionsPanel();
    this.setState({
      isTrackingStarted: false,
    });
  };

  updateSuggestions = lastKeyword => {
    this.props.triggerSuggestionCallback(lastKeyword);
  };

  render() {
    const {
      containerStyle,
      style,
      tagContainerStyle,
      tagTextStyle,
      displayDeleteButtonOnLongPress,
      deleteTagOnPress,
      editTagOnPress,
      onTagPress,
      readonly,
      maxNumberOfTags,
      inputStyle,
      inputContainerStyle,
      textInputProps,
      renderTag,
      suggestionsData,
      renderSuggestionsRow,
      suggestionPanelStyle,
      suggestionPanelHorizontal,
    } = this.props;

    const { displayDeleteButton, suggestionRowHeight } = this.state;

    return (
      <Animated.View style={[{ width: "100%" }]}>
        {suggestionsData && suggestionsData.length > 0 && (
          <Animated.View
            style={[
              {
                backgroundColor: "#fff",
                left: 0,
                right: 0,
                position: "absolute",
                bottom: 50,
                zIndex: 1,
                height: suggestionRowHeight,
              },
              suggestionPanelStyle,
            ]}>
            <FlatList
              keyboardShouldPersistTaps={"always"}
              data={suggestionsData}
              keyExtractor={(item, index) => index}
              horizontal={suggestionPanelHorizontal}
              renderItem={rowData => {
                return renderSuggestionsRow(
                  rowData,
                  tag => this.addTag(tag),
                  this.stopTracking
                );
              }}
            />
          </Animated.View>
        )}

        <View style={[styles.container, containerStyle, style]}>
          {this.state.tags.map((tag, index) => {
            const tagProps = {
              tag,
              index,
              displayDeleteButton,
              deleteTagOnPress,
              editTagOnPress,
              onLongPress: e => {
                if (displayDeleteButtonOnLongPress) {
                  this.setState(({ displayDeleteButton }) => ({
                    displayDeleteButton: !displayDeleteButton,
                  }));
                }
              },
              onDeleteTag: e => {
                this.setState(
                  {
                    tags: [
                      ...this.state.tags.slice(0, index),
                      ...this.state.tags.slice(index + 1),
                    ],
                  },
                  () => {
                    this.props.onChangeTags &&
                      this.props.onChangeTags(this.state.tags);
                    onTagPress && onTagPress(index, tag, e, true);
                  }
                );
              },
              onPress: e => {
                if (deleteTagOnPress && !readonly) {
                  this.setState(
                    {
                      tags: [
                        ...this.state.tags.slice(0, index),
                        ...this.state.tags.slice(index + 1),
                      ],
                    },
                    () => {
                      this.props.onChangeTags &&
                        this.props.onChangeTags(this.state.tags);
                      onTagPress && onTagPress(index, tag, e, true);
                    }
                  );
                } else if (editTagOnPress && !readonly) {
                  this.setState(
                    {
                      tags: [
                        ...this.state.tags.slice(0, index),
                        ...this.state.tags.slice(index + 1),
                      ],
                      text: tag,
                    },
                    () => {
                      this.input.focus();
                    }
                  );
                } else {
                  onTagPress && onTagPress(index, tag, e, false);
                }
              },
              tagContainerStyle,
              tagTextStyle,
            };

            return renderTag(tagProps);
          })}

          {!readonly && maxNumberOfTags > this.state.tags.length && (
            <View style={[styles.textInputContainer, inputContainerStyle]}>
              <TextInput
                {...textInputProps}
                ref={input => {
                  this.input = input;
                }}
                value={this.state.text}
                style={[styles.textInput, inputStyle]}
                onChangeText={this.onChangeText}
                onSubmitEditing={this.onSubmitEditing}
                underlineColorAndroid="transparent"
              />
            </View>
          )}
        </View>
      </Animated.View>
    );
  }
}

Tags.defaultProps = {
  initialTags: [],
  suggestionsData: [],
  initialText: " ",
  createTagOnString: [",", " "],
  createTagOnReturn: false,
  readonly: false,
  deleteTagOnPress: true,
  editTagOnPress: false,
  maxNumberOfTags: Number.POSITIVE_INFINITY,
  removeSpecialChar: [],
  startSearchAt: 3,
  suggestionPanelHeight: 50,
  suggestionPanelHorizontal: true,
  renderTag: ({ tag, index, ...rest }) => (
    <Tag key={`${tag}-${index}`} label={tag} {...rest} />
  ),
};

Tags.propTypes = {
  initialText: PropTypes.string,
  initialTags: PropTypes.arrayOf(PropTypes.string),
  createTagOnString: PropTypes.array,
  createTagOnReturn: PropTypes.bool,
  removeSpecialChar: PropTypes.array,
  suggestionsData: PropTypes.array,
  onChangeTags: PropTypes.func,
  onChangeText: PropTypes.func,
  triggerSuggestionCallback: PropTypes.func,
  readonly: PropTypes.bool,
  maxNumberOfTags: PropTypes.number,
  startSearchAt: PropTypes.number,
  suggestionPanelHeight: PropTypes.number,
  deleteTagOnPress: PropTypes.bool,
  suggestionPanelHorizontal: PropTypes.bool,
  editTagOnPress: PropTypes.bool,
  displayDeleteButtonOnLongPress: PropTypes.bool,
  renderTag: PropTypes.func,
  /* style props */
  containerStyle: PropTypes.any,
  style: PropTypes.any,
  inputContainerStyle: PropTypes.any,
  inputStyle: PropTypes.any,
  tagContainerStyle: PropTypes.any,
  tagTextStyle: PropTypes.any,
  suggestionPanelStyle: PropTypes.any,

  textInputProps: PropTypes.object,
};

export { Tag };
export default Tags;
