import React, { Component } from 'react';
import { View, Button } from 'react-native';
import { useNavigation } from '@react-navigation/native';

class Search extends Component {
  render() {
    const navigation = this.props.navigation;

    return (
      <View>
        <Button
          title="Test 열기"
          onPress={() => navigation.navigate('Test')}
        />
      </View>
    );
  }
}

export default Search;