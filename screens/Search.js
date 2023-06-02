import React from 'react';
import { View, Button } from 'react-native';
import extractUltraSrtWeather from './Main';

const Search = ({ navigation, route }) => {
  const { srcUltraSrtInfo } = route.params;
  console.log("tqtqtq", srcUltraSrtInfo);
  //console.log("ㅈㅂ", extractUltraSrtWeather(searchUrl));
  //const ultraSrtWeatherInfo = extractUltraSrtWeather(searchUrl);
  console.log("온도도돋",srcUltraSrtInfo)
  return (
    <View>
      <Button
        title="Test 열기"
        onPress={() => navigation.navigate('Test')}
      />
    </View>
  );
};

export default Search;