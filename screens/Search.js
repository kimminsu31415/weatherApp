import React, {useEffect, useState} from 'react';
import { View, Button, Text, Dimensions, StyleSheet, ScrollView, } from 'react-native';
import extractUltraSrtWeather from './Main';
import {commentWeather} from './Main';
import {sensoryTemp} from './Main'
import {makeSensoryData} from './Main'


const {width:screenWidth} = Dimensions.get("window");


const Search = ({ navigation, route }) => {
    const [TEMP, setTemp]=useState();
    const [SKY, setSky]=useState();
    const [wind, setWind]=useState();
    const [rainfall, setRainfall]=useState();
    const [sensoryTEMP, setSensoryTemp]=useState();

    const [lowerTEMP, setLowerTemp]=useState();
    const [upperTEMP, setUpperTemp]=useState();

    const getSearchWeather = async () => {

        const { srcUltraSrtInfo, srcVilageInfo } = route.params;
        console.log("tqtqtq", srcUltraSrtInfo);
        //console.log("ㅈㅂ", extractUltraSrtWeather(searchUrl));
        //const ultraSrtWeatherInfo = extractUltraSrtWeather(searchUrl);
        console.log("온도도돋",srcUltraSrtInfo)

        setSensoryTemp(sensoryTemp(parseFloat(ultraSrtWeatherInfo.temperature),parseFloat(ultraSrtWeatherInfo.humidity)));
        setRainfall(srcUltraSrtInfo.rainfall);
        setTemp(JSON.stringify(commentWeather(srcUltraSrtInfo,"ultraSrt").temperature).replace(/\"/gi, "")); // 기온
        setSky(JSON.stringify(commentWeather(srcUltraSrtInfo,"ultraSrt").sky).replace(/\"/gi, "")); // 하늘 상태
        setWind(JSON.stringify(commentWeather(srcUltraSrtInfo,"ultraSrt").wind).replace(/\"/gi, "")); // 풍속

        setLowerTemp(JSON.stringify(srcVilageInfo.lowerTmp).replace(/\"/gi, ""));
        setUpperTemp(JSON.stringify(srcVilageInfo.upperTmp).replace(/\"/gi, ""));

    }

    useEffect(() => {
        getSearchWeather();
      }, []);

    return (
    <View style={styles.container}>
        {/* <StatusBar style="light"></StatusBar>
        <View style={styles.city}>
        <Text style={styles.cityName}>{city} {subregion} {district}</Text>
        </View> */}
        
        {/* {tempData && (
        <LineChart
        data={tempData}
        width={screenWidth}
        height={220}
        chartConfig={chartConfig}
        />
        )}
        {windData && (
        <LineChart
            data={windData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
        />
        )}   */}
        <ScrollView
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        horizontal 
        contentContainerStyle={styles.weather}
        >
        {/* <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
            <>{tempData && (
            <LineChart
                data={tempData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
            />)} 
            </>
        )}
            <Text style={styles.temp}>{TEMP}</Text>
            <Text style={styles.description}>{SKY}</Text>
        </View>
        <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
        <>
            {windData && (
            <LineChart
            data={windData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            />
            )}  
        </>
        )}
            <Text style={styles.temp}>{lowerTEMP}</Text>
            <Text style={styles.description}>{upperTEMP}</Text>
        </View>
        <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
        <>
            {rainData && (
            <LineChart
            data={rainData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            />
            )}  
        </>
        )}
            <Text style={styles.temp}>미세먼지 등급 </Text>
            <Text style={styles.description}>{pmGrade10}</Text>
        </View>
        <View style={styles.day}>
        {isLoading ? (
        <Text>Loading...</Text> // 로딩 상태 표시
        ) : (
            <>{sensoryData && (
            <LineChart
                data={sensoryData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
            />)} 
            </>
        )}
            <Text style={styles.temp}>초미세먼지 등급</Text>
            <Text style={styles.description}>{pmGrade25}</Text>
        </View>
        <View style={styles.day}>
            <Text style={styles.temp}>미세먼지 농도</Text>
            <Text style={styles.description}>{pmValue10}</Text>
        </View>
        <View style={styles.day}>
            <Text style={styles.temp}>초미세먼지 농도</Text>
            <Text style={styles.description}>{pmValue25}</Text>
        </View>
        <View style={styles.day}>
            <Text style={styles.temp}>체감온도</Text>
            <Text style={styles.description}>{sensoryTEMP}</Text>
        </View> */}
        <View style={styles.day}>
            <Text style={styles.temp}>풍속</Text>
            <Text style={styles.description}>{wind}</Text>
        </View>
        <View style={styles.day}>
            <Text style={styles.temp}>강수량</Text>
            <Text style={styles.description}>{rainfall}</Text>
            
        </View>
        {/* <View style={{ flex: 1, padding: 16 }}>
        
        </View> */}
        </ScrollView>
    </View>
    );
}

const styles = StyleSheet.create({
    container:{
        flex:1, 
        backgroundColor:"green"
    },
    city:{
        flex:1,
        //backgroundColor:"blue",
        justifyContent:"center",
        alignItems:"center"
    },
    cityName:{
        fontSize:60,
        fontWeight:"500"
    },
    weather:{
        //flex:3,
        //backgroundColor:"blue"
    },
    day:{
        width:screenWidth,
        //flex:1,
        //backgroundColor:"teal",
        alignItems:"center"
    },
    temp:{
        marginTop:30,
        fontSize:100,
    },
    description:{
        fontSize:70,
    }
    })

  


export default Search;

// return (
//     <View>
//       <Button
//         title="Test 열기"
//         onPress={() => navigation.navigate('Test')}
//       />
//     </View>
//   );