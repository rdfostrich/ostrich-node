cmake_minimum_required(VERSION 3.3)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wno-deprecated")
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
include("${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/ext/hunter/HunterGate.cmake")
HunterGate(
    URL "https://github.com/ruslo/hunter/archive/v0.12.40.tar.gz"
    SHA1 "0ccc3f3fd571676a1804723984598f9f90a4d6bc"
)

# Include BoostLib module
set(NODE_MODULES_DIR "${CMAKE_CURRENT_SOURCE_DIR}/node_modules")
if(NOT EXISTS "${NODE_MODULES_DIR}/boost-lib/cmake/BoostLib.cmake")
    set(NODE_MODULES_DIR "${CMAKE_CURRENT_SOURCE_DIR}/..")
    if(NOT EXISTS "${NODE_MODULES_DIR}/boost-lib/cmake/BoostLib.cmake")
        message(FATAL_ERROR "Couldn't find boost-lib cmake file at ${NODE_MODULES_DIR}")
    endif()
endif()
set(CMAKE_MODULE_PATH "${CMAKE_MODULE_PATH};${NODE_MODULES_DIR}/boost-lib/cmake")
include(BoostLib)

# Set project
project(ostrich)

# Include cmake-js requirements
include_directories(${CMAKE_JS_INC} ../nan)

# Add directories
include_directories(
        ${CMAKE_CURRENT_SOURCE_DIR}/lib/
        ${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/src/main/cpp/
        ${CMAKE_CURRENT_SOURCE_DIR}/deps/hdt/libcds/includes/
        ${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/deps/hdt/libhdt/include/
        ${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/deps/hdt/libhdt/src/
)

# Add source files
file(GLOB_RECURSE SOURCE_FILES
        "${CMAKE_CURRENT_SOURCE_DIR}/lib/ostrich.cc"
        "${CMAKE_CURRENT_SOURCE_DIR}/lib/OstrichStore.cc"
        "${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/src/main/cpp/*/*.h"
        "${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/src/main/cpp/*/*.cc"
        "${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/src/main/cpp/simpleprogresslistener.h"
        "${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/src/main/cpp/simpleprogresslistener.cc"
        "${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/deps/hdt/libhdt/src/*.h"
        "${CMAKE_CURRENT_SOURCE_DIR}/deps/ostrich/deps/hdt/libhdt/src/*.cpp"
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
