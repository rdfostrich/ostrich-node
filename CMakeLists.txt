cmake_minimum_required(VERSION 3.3)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-deprecated -stdlib=libc++")
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
include("${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/ext/hunter/HunterGate.cmake")
HunterGate(
    URL "https://github.com/ruslo/hunter/archive/v0.12.40.tar.gz"
    SHA1 "0ccc3f3fd571676a1804723984598f9f90a4d6bc"
)

# Include BoostLib module
set(NODE_MODULES_DIR "${CMAKE_CURRENT_SOURCE_DIR}/node_modules")
if(NOT IS_DIRECTORY "${NODE_MODULES_DIR}")
    get_filename_component(PARENT_DIR "${CMAKE_CURRENT_SOURCE_DIR}" DIRECTORY)
    get_filename_component(PARENT_DIR_NAME "${PARENT_DIR}" NAME)
    if(PARENT_DIR_NAME STREQUAL "node_modules")
        set(NODE_MODULES_DIR "${CMAKE_CURRENT_SOURCE_DIR}/..")
    endif()
endif()
if(NOT EXISTS "${NODE_MODULES_DIR}/boost-lib/cmake/BoostLib.cmake")
    message(FATAL_ERROR "Couldn't find boost-lib cmake file")
endif()
set(CMAKE_MODULE_PATH "${CMAKE_MODULE_PATH};${NODE_MODULES_DIR}/boost-lib/cmake")
include(BoostLib)


#file(GLOB_RECURSE boostlib_cmake_path "${CMAKE_CURRENT_SOURCE_DIR}/node_modules" "BoostLib.cmake")
#list(GET boostlib_cmake_path 0 boostlib_cmake_path)
#get_filename_component(boostlib_cmake_path "${boostlib_cmake_path}" DIRECTORY)
#SET(CMAKE_MODULE_PATH "${CMAKE_MODULE_PATH};${boostlib_cmake_path}")
#include(BoostLib)

# Set project
project(ostrich)

# Include cmake-js requirements
include_directories(${CMAKE_JS_INC} ../nan)

# Add directories
include_directories(
        ${CMAKE_CURRENT_SOURCE_DIR}/lib/
        ${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/src/main/cpp/
        ${CMAKE_CURRENT_SOURCE_DIR}/deps/hdt/libcds-v1.0.12/includes/
        ${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/deps/hdt/hdt-lib/include/
        ${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/deps/hdt/hdt-lib/src/
)

# Add source files
file(GLOB_RECURSE SOURCE_FILES
        "${CMAKE_CURRENT_SOURCE_DIR}/lib/ostrich.cc"
        "${CMAKE_CURRENT_SOURCE_DIR}/lib/OstrichStore.cc"
        "${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/src/main/cpp/*/*.h"
        "${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/src/main/cpp/*/*.cc"
        "${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/src/main/cpp/simpleprogresslistener.h"
        "${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/src/main/cpp/simpleprogresslistener.cc"
        "${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/deps/hdt/hdt-lib/src/*.h"
        "${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/deps/hdt/hdt-lib/src/*.cpp"
)

# Set cmake-js binary
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES})
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})

# Add boost libs
require_boost_libs(1.58.0 iostreams;regex)
include_directories(${Boost_INCLUDE_DIRS})
target_link_libraries(${PROJECT_NAME} ${Boost_LIBRARIES})

# Add Kyoto Cabinet
find_library(KYOTO_SHARED_LIBRARY kyotocabinet PATHS ${KC_ROOT}/lib)
find_path(KYOTO_INCLUDE_DIR kchashdb.h PATHS ${KC_ROOT}/include)
if (KYOTO_SHARED_LIBRARY MATCHES KYOTO_LIBRARY-NOTFOUND)
    message("FATAL_ERROR Kyoto Cabinet not found!")
    set(Kyoto-NOTFOUND 1)
    set(Kyoto-FOUND)
else (KYOTO_SHARED_LIBRARY MATCHES KYOTO_LIBRARY-NOTFOUND)
    if (KYOTO_INCLUDE_DIR MATCHES KYOTO_INCLUDE_DIR-NOTFOUND)
        message("FATAL_ERROR Kyoto Cabinet not found!")
        set(Kyoto-NOTFOUND 1)
        set(Kyoto-FOUND)
    else (KYOTO_INCLUDE_DIR MATCHES KYOTO_INCLUDE_DIR-NOTFOUND)
        set(Kyoto-FOUND 1)
        set(Kyoto-NOTFOUND)
        message(STATUS "Kyoto Cabinet Found")
        # get the static version
        string(REGEX REPLACE "\\${CMAKE_SHARED_LIBRARY_SUFFIX}$" ".a" KYOTO_STATIC_LIBRARY ${KYOTO_SHARED_LIBRARY})
        message(STATUS "Kyoto Cabinet: ${KYOTO_STATIC_LIBRARY}" )
        target_link_libraries(${PROJECT_NAME} ${KYOTO_SHARED_LIBRARY})
        include_directories(${KYOTO_INCLUDE_DIR})
        add_definitions(-DHAS_KYOTO)
    endif (KYOTO_INCLUDE_DIR MATCHES KYOTO_INCLUDE_DIR-NOTFOUND)
endif (KYOTO_SHARED_LIBRARY MATCHES KYOTO_LIBRARY-NOTFOUND)

if (Kyoto-FOUND)
    add_definitions(-DHAVE_KYOTO)
endif()

# Add pthreads
set(THREADS_PREFER_PTHREAD_FLAG ON)
find_package(Threads REQUIRED)
target_link_libraries(${PROJECT_NAME} Threads::Threads)

if(NOT MSVC)
    set(PThreadLib -pthread)
endif()