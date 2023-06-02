import React, {Component} from "react";
import { StyleSheet, Text, View } from "react-native";
import FilterProducts from "./FilterProducts";

class App extends Component{

  render(){
    return (
      <View style={styles.container}>
        <FilterProducts />
      </View>
    );
  }
}

export default App;

const styles = StyleSheet.create({
  container:{
    // flex: 1,
    // backgroundColor: '#fff',
    // alignItems: "center",
    // justifyContent: "center",
  },
});