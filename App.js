import { 
  FlatList, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TextInput, 
  View,
  Alert, 
  Button,
  TouchableHighlight,
  TouchableOpacity,
  Share,
} from "react-native";
import React, { useState, Component } from "react";


export default function App(){
  return(
    <View>
      <Text></Text><Text></Text><Text></Text>
      <Button 
      title="오늘의 날씨를 공유할까요?"
      onPress={() => {Share.share({message:"공유메시지 설정"})}}
      />
    </View>
  );
}